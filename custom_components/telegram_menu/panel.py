"""Telegram Menu Home Assistant sidebar panel."""
from __future__ import annotations

from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .version import VERSION

PANEL_URL = f"/api/{DOMAIN}/panel.js"
PANEL_FRONTEND_URL_PATH = "telegram_menu"
PANEL_NAME = "telegram-menu-panel"
PANEL_ICON = "mdi:keyboard"
PANEL_TITLE = "Telegram Menu"
PANEL_REGISTERED_KEY = f"{DOMAIN}_panel_registered"

PANEL_TITLES = {
    "de": "Telegram Menü",
    "en": "Telegram Menu",
    "fr": "Menu Telegram",
}


async def async_register_panel(
    hass: HomeAssistant, menus: dict, language: str = "en"
) -> None:
    """Register the Telegram Menu sidebar panel."""
    panel_path = hass.config.path("custom_components", DOMAIN, "panel.js")

    # The config entry can be retried by Home Assistant after a setup error.
    # In that case the static HTTP route may already be registered.
    if not hass.data.get(PANEL_REGISTERED_KEY):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_URL, panel_path, True)]
        )
        hass.data[PANEL_REGISTERED_KEY] = True

    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLES.get(language, PANEL_TITLE),
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_FRONTEND_URL_PATH,
        require_admin=True,
        config={
            "_panel_custom": {
                "name": PANEL_NAME,
                "module_url": f"{PANEL_URL}?{VERSION}",
                "embed_iframe": True,
            },
            "version": VERSION,
            "language": language,
            "menus": menus,
        },
    )


def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove the Telegram Menu sidebar panel."""
    async_remove_panel(hass, PANEL_FRONTEND_URL_PATH, warn_if_unknown=False)
