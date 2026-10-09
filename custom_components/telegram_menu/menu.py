"""Telegram keyboard rendering."""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_CHAT_ID, CONF_MENUS, CONF_NAVIGATION_BUTTONS, CONF_NOTIFY_ENTITY

KEYBOARD_REPLY = "reply"
KEYBOARD_INLINE = "inline"


def normalize_telegram_command(value: Any) -> str:
    """Normalize configured and incoming values to ASCII Telegram commands."""
    command = str(value or "").strip().lower().split("@", 1)[0]
    command = (
        command.replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
    )
    command = "".join(
        char for char in command
        if char == "/" or (char.isascii() and (char.isalnum() or char == "_"))
    )
    command = command.lstrip("/")
    return f"/{command}" if command else ""

BACK_COMMAND = "/menue_back"
MAIN_COMMAND = "/menue_main"
BACK_LABEL = "⬅️ Zurück"
MAIN_LABEL = "🏠 Hauptmenü"


class MenuManager:
    """Manage Telegram reply and inline keyboards."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        # Navigation history is isolated per Telegram chat.
        self._navigation_stacks: dict[str, list[str]] = {}

    @property
    def menus(self) -> dict[str, Any]:
        return self.entry.data.get(CONF_MENUS, {})

    @property
    def notify_entity(self) -> str:
        return self.entry.data[CONF_NOTIFY_ENTITY]

    @property
    def default_chat_id(self) -> str:
        return str(self.entry.data[CONF_CHAT_ID])

    def find_action(
        self, command: str, chat_id: str | None = None
    ) -> dict[str, Any] | None:
        """Find a command in the active menu first, then search all menus."""
        menu_names: list[str] = []
        chat = str(chat_id or self.default_chat_id)
        stack = self._navigation_stacks.get(chat, [])
        if stack and stack[-1] in self.menus:
            menu_names.append(stack[-1])
        menu_names.extend(name for name in self.menus if name not in menu_names)

        for menu_name in menu_names:
            menu = self.menus.get(menu_name)
            if not isinstance(menu, dict):
                continue
            for row in menu.get("rows", []):
                for button in row:
                    if not isinstance(button, dict):
                        continue
                    if normalize_telegram_command(button.get("command", "")) != normalize_telegram_command(command):
                        continue

                    open_menu = str(button.get("open_menu", "")).strip()
                    if open_menu:
                        return {"_open_menu": open_menu}

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
        """Show a menu and start a fresh navigation history."""
        chat = str(chat_id or self.default_chat_id)
        if not isinstance(self.menus.get(menu_name), dict):
            raise ValueError(f"Unknown Telegram menu: {menu_name}")

        self._navigation_stacks[chat] = [menu_name]
        await self._send_menu(menu_name, chat)

    async def open_submenu(self, menu_name: str, chat_id: str | None = None) -> None:
        """Push a submenu onto this chat's navigation history."""
        chat = str(chat_id or self.default_chat_id)
        if not isinstance(self.menus.get(menu_name), dict):
            raise ValueError(f"Unknown Telegram menu: {menu_name}")

        stack = self._navigation_stacks.get(chat)
        if not stack:
            initial = "main" if isinstance(self.menus.get("main"), dict) else menu_name
            stack = [initial]
            self._navigation_stacks[chat] = stack
        if stack[-1] != menu_name:
            stack.append(menu_name)
        await self._send_menu(menu_name, chat)

    async def go_back(self, chat_id: str | None = None) -> None:
        """Return to the previous menu for this chat, if one exists."""
        chat = str(chat_id or self.default_chat_id)
        stack = self._navigation_stacks.get(chat)
        if not stack:
            if isinstance(self.menus.get("main"), dict):
                self._navigation_stacks[chat] = ["main"]
                await self._send_menu("main", chat)
            return

        if len(stack) > 1:
            stack.pop()
        current = stack[-1]
        if isinstance(self.menus.get(current), dict):
            await self._send_menu(current, chat)

    async def go_main(self, chat_id: str | None = None) -> None:
        """Jump directly to the main menu and reset this chat's history."""
        if not isinstance(self.menus.get("main"), dict):
            raise ValueError("Das Hauptmenü 'main' ist nicht vorhanden.")
        chat = str(chat_id or self.default_chat_id)
        self._navigation_stacks[chat] = ["main"]
        await self._send_menu("main", chat)

    async def _send_menu(self, menu_name: str, chat_id: str) -> None:
        """Send a menu without changing navigation history."""
        menu = self.menus.get(menu_name)
        if not isinstance(menu, dict):
            raise ValueError(f"Unknown Telegram menu: {menu_name}")

        is_submenu = menu_name != "main"
        keyboard_type = menu.get("keyboard_type", KEYBOARD_REPLY)
        data = {
            "entity_id": self.notify_entity,
            "chat_id": [str(chat_id)],
            "message": menu.get("message", "Bitte auswählen:"),
        }

        navigation_buttons_enabled = self.entry.data.get(CONF_NAVIGATION_BUTTONS, True)
        if keyboard_type == KEYBOARD_INLINE:
            data["inline_keyboard"] = self._render_inline_keyboard(
                menu, is_submenu, navigation_buttons_enabled
            )
        else:
            # Reply keyboard buttons send their visible text back as a message.
            data["keyboard"] = self._render_reply_keyboard(
                menu, is_submenu, navigation_buttons_enabled
            )

        await self.hass.services.async_call(
            "telegram_bot",
            "send_message",
            data,
            blocking=True,
        )

    @staticmethod
    def _render_reply_keyboard(
        menu: dict[str, Any],
        is_submenu: bool = False,
        navigation_buttons_enabled: bool = True,
    ) -> list[str]:
        """Render a Telegram Reply Keyboard, adding navigation controls in submenus."""
        keyboard: list[str] = []

        for row in menu.get("rows", []):
            rendered_row: list[str] = []
            for button in row:
                if isinstance(button, dict):
                    command = normalize_telegram_command(button.get("command", ""))
                    if command:
                        rendered_row.append(command)
                elif isinstance(button, str) and button.strip():
                    command = normalize_telegram_command(button)
                    if command:
                        rendered_row.append(command)
            if rendered_row:
                keyboard.append(", ".join(rendered_row))

        if is_submenu and navigation_buttons_enabled:
            # Human-readable labels normalize to the legacy navigation aliases.
            keyboard.append(f"{BACK_LABEL}, {MAIN_LABEL}")
        return keyboard

    @staticmethod
    def _render_inline_keyboard(
        menu: dict[str, Any],
        is_submenu: bool = False,
        navigation_buttons_enabled: bool = True,
    ) -> list[list[list[str]]]:
        """Render inline buttons and append callback-based navigation controls."""
        keyboard: list[list[list[str]]] = []

        for row in menu.get("rows", []):
            rendered_row: list[list[str]] = []
            for button in row:
                if isinstance(button, dict):
                    command = normalize_telegram_command(button.get("command", ""))
                    label = str(button.get("label", command)).strip()
                    if command and label:
                        rendered_row.append([label, command])
                elif isinstance(button, str) and button.strip():
                    command = normalize_telegram_command(button)
                    if command:
                        rendered_row.append([command, command])
            if rendered_row:
                keyboard.append(rendered_row)

        if is_submenu and navigation_buttons_enabled:
            keyboard.append([[BACK_LABEL, BACK_COMMAND], [MAIN_LABEL, MAIN_COMMAND]])
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
