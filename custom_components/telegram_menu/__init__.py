"""Telegram Menu integration for Home Assistant."""
from __future__ import annotations

from typing import Any

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv
import voluptuous as vol

from .const import CONF_CHAT_ID, CONF_MENUS, CONF_NOTIFY_ENTITY, DOMAIN
from .menu import MenuManager
from .panel import async_register_panel, async_unregister_panel

PLATFORMS: list[str] = []

WS_GET_CONFIG = f"{DOMAIN}/get_config"
WS_SAVE_CONFIG = f"{DOMAIN}/save_config"


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the Telegram Menu integration."""
    hass.data.setdefault(DOMAIN, {})

    async def handle_telegram_event(event: Event) -> None:
        """Execute a configured button action for a Telegram command."""
        command = str(event.data.get("command", "")).strip()
        if not command:
            return

        chat_id = str(event.data.get("chat_id", ""))
        for manager in hass.data[DOMAIN].values():
            if chat_id != manager.default_chat_id:
                continue

            action = manager.find_action(command)
            if action:
                await manager.execute_action(action)
                return

    async def handle_show(call: ServiceCall) -> None:
        """Show a configured Telegram menu."""
        entry_id = call.data.get("entry_id")
        menu = call.data.get("menu", "main")
        chat_id = call.data.get("chat_id")

        manager = _get_manager(hass, entry_id)
        await manager.show_menu(menu, chat_id)

    async def handle_hide(call: ServiceCall) -> None:
        """Hide the Telegram reply keyboard."""
        entry_id = call.data.get("entry_id")
        chat_id = call.data.get("chat_id")

        manager = _get_manager(hass, entry_id)
        await manager.hide_menu(chat_id)

    hass.services.async_register(
        DOMAIN,
        "show",
        handle_show,
        schema=vol.Schema(
            {
                vol.Optional("entry_id"): cv.string,
                vol.Optional("menu", default="main"): cv.string,
                vol.Optional("chat_id"): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        "hide",
        handle_hide,
        schema=vol.Schema(
            {
                vol.Optional("entry_id"): cv.string,
                vol.Optional("chat_id"): cv.string,
            }
        ),
    )

    hass.bus.async_listen("telegram_command", handle_telegram_event)
    hass.bus.async_listen("telegram_callback", handle_telegram_event)

    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_save_config)
    return True


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_GET_CONFIG,
    }
)
@callback
def ws_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the current Telegram Menu configuration."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Admin access required")
        return

    try:
        manager = _get_manager(hass, None)
    except ValueError as err:
        connection.send_error(msg["id"], "not_configured", str(err))
        return

    connection.send_result(
        msg["id"],
        {
            "notify_entity": manager.notify_entity,
            "chat_id": manager.default_chat_id,
            "menus": manager.menus,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_SAVE_CONFIG,
        vol.Required("menus"): dict,
    }
)
@callback
def ws_save_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save menus from the graphical editor."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Admin access required")
        return

    try:
        manager = _get_manager(hass, None)
    except ValueError as err:
        connection.send_error(msg["id"], "not_configured", str(err))
        return

    menus = msg["menus"]
    if not isinstance(menus, dict):
        connection.send_error(msg["id"], "invalid_config", "Menus must be an object")
        return

    entry = manager.entry
    hass.config_entries.async_update_entry(
        entry,
        data={
            **entry.data,
            CONF_MENUS: menus,
        },
    )
    connection.send_result(msg["id"], {"menus": menus})


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a Telegram Menu config entry."""
    manager = MenuManager(hass, entry)
    hass.data[DOMAIN][entry.entry_id] = manager
    await async_register_panel(hass, manager.menus)
    return True


async def async_migrate_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Migrate older Telegram Menu config entries."""
    if config_entry.version < 4:
        hass.config_entries.async_update_entry(
            config_entry,
            version=4,
        )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Telegram Menu config entry."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    async_unregister_panel(hass)
    return True


def _get_manager(hass: HomeAssistant, entry_id: str | None) -> MenuManager:
    """Get a configured menu manager."""
    entries = hass.data[DOMAIN]
    if entry_id:
        manager = entries.get(entry_id)
        if manager is None:
            raise ValueError(f"Telegram Menu entry not found: {entry_id}")
        return manager
    if len(entries) == 1:
        return next(iter(entries.values()))
    if not entries:
        raise ValueError("No Telegram Menu configuration is loaded")
    raise ValueError("More than one Telegram Menu configuration exists; specify entry_id")
