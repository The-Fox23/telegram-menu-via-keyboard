"""Telegram keyboard rendering."""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_CHAT_ID, CONF_MENUS, CONF_NOTIFY_ENTITY

KEYBOARD_REPLY = "reply"
KEYBOARD_INLINE = "inline"


class MenuManager:
    """Manage Telegram reply and inline keyboards."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry

    @property
    def menus(self) -> dict[str, Any]:
        return self.entry.data.get(CONF_MENUS, {})

    @property
    def notify_entity(self) -> str:
        return self.entry.data[CONF_NOTIFY_ENTITY]

    @property
    def default_chat_id(self) -> str:
        return str(self.entry.data[CONF_CHAT_ID])

    def find_action(self, command: str) -> dict[str, Any] | None:
        """Find the first configured action for a Telegram command or button text."""
        value = str(command or "").strip()
        if not value:
            return None

        # Telegram commands can arrive with optional bot-name suffixes
        # (for example /test@my_bot). Compare the command itself.
        normalized = value.split("@", 1)[0].strip().lower()

        for menu in self.menus.values():
            if not isinstance(menu, dict):
                continue
            for row in menu.get("rows", []):
                for button in row:
                    if not isinstance(button, dict):
                        continue

                    configured_command = str(button.get("command", "")).strip().lower()
                    if configured_command and not configured_command.startswith("/"):
                        configured_command = "/" + configured_command

                    if normalized != configured_command:
                        continue

                    actions = button.get("actions", [])
                    if isinstance(actions, list) and actions:
                        action = actions[0]
                        if isinstance(action, dict):
                            return action
        return None

    async def execute_action(self, action: dict[str, Any]) -> None:
        """Execute one configured Home Assistant service action."""
        service = str(action.get("action", "")).strip()
        if not service or "." not in service:
            return

        domain, service_name = service.split(".", 1)
        data = action.get("data", {})
        target = action.get("target", {})

        if not isinstance(data, dict):
            data = {}
        if not isinstance(target, dict):
            target = {}

        await self.hass.services.async_call(
            domain,
            service_name,
            data,
            target=target,
            blocking=True,
        )

    async def show_menu(self, menu_name: str, chat_id: str | None = None) -> None:
        """Show a configured Telegram keyboard."""
        menu = self.menus.get(menu_name)
        if not isinstance(menu, dict):
            raise ValueError(f"Unknown Telegram menu: {menu_name}")

        keyboard_type = menu.get("keyboard_type", KEYBOARD_REPLY)
        data = {
            "entity_id": self.notify_entity,
            "chat_id": [str(chat_id or self.default_chat_id)],
            "message": menu.get("message", "Bitte auswählen:"),
        }

        if keyboard_type == KEYBOARD_INLINE:
            data["inline_keyboard"] = self._render_inline_keyboard(menu)
        else:
            # Important: Telegram Reply Keyboard buttons send their visible
            # text back as a message. Therefore the command itself must be
            # displayed if existing telegram_command automations are to keep
            # working unchanged.
            data["keyboard"] = self._render_reply_keyboard(menu)

        await self.hass.services.async_call(
            "telegram_bot",
            "send_message",
            data,
            blocking=True,
        )

    @staticmethod
    def _render_reply_keyboard(menu: dict[str, Any]) -> list[list[str]]:
        """Render a Telegram Reply Keyboard."""
        keyboard: list[str] = []

        # Home Assistant's current telegram_bot.send_message action expects
        # each reply-keyboard row as one comma-separated string.
        for row in menu.get("rows", []):
            rendered_row: list[str] = []
            for button in row:
                if isinstance(button, dict):
                    command = str(button.get("command", "")).strip()
                    if command:
                        rendered_row.append(command)
                elif isinstance(button, str) and button.strip():
                    rendered_row.append(button.strip())
            if rendered_row:
                keyboard.append(", ".join(rendered_row))

        return keyboard

    @staticmethod
    def _render_inline_keyboard(menu: dict[str, Any]) -> list[str]:
        """Render an Inline Keyboard in Home Assistant's string format."""
        keyboard: list[str] = []

        for row in menu.get("rows", []):
            rendered_row: list[str] = []
            for button in row:
                if isinstance(button, dict):
                    command = str(button.get("command", "")).strip()
                    if command and not command.startswith("/"):
                        command = "/" + command
                    if command:
                        rendered_row.append(f"{command}:{command}")
                elif isinstance(button, str) and button.strip():
                    command = button.strip()
                    if not command.startswith("/"):
                        command = "/" + command
                    rendered_row.append(f"{command}:{command}")
            if rendered_row:
                keyboard.append(", ".join(rendered_row))

        return keyboard

    async def hide_menu(self, chat_id: str | None = None) -> None:
        """Remove the Telegram Reply Keyboard."""
        data = {
            "entity_id": self.notify_entity,
            "chat_id": [str(chat_id or self.default_chat_id)],
            "message": "Tastatur ausgeblendet.",
            "keyboard": [],
        }

        await self.hass.services.async_call(
            "telegram_bot",
            "send_message",
            data,
            blocking=True,
        )
