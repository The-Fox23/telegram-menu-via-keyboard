"""Focused navigation tests without a running Home Assistant instance."""
import asyncio
import importlib.util
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import AsyncMock, patch


ROOT = Path(__file__).resolve().parents[1] / "custom_components" / "telegram_menu"


def load_menu():
    package = types.ModuleType("telegram_menu_test")
    package.__path__ = [str(ROOT)]
    config_entries = types.ModuleType("homeassistant.config_entries")
    config_entries.ConfigEntry = object
    core = types.ModuleType("homeassistant.core")
    core.HomeAssistant = object
    with patch.dict(sys.modules, {
        "telegram_menu_test": package,
        "homeassistant": types.ModuleType("homeassistant"),
        "homeassistant.config_entries": config_entries,
        "homeassistant.core": core,
    }):
        spec = importlib.util.spec_from_file_location("telegram_menu_test.menu", ROOT / "menu.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    return module


menu = load_menu()


class NavigationTests(unittest.TestCase):
    def test_language_and_toggle_for_both_keyboards(self):
        keyboard = {"rows": [[{"command": "/test"}]]}
        for language, (back, main) in menu.NAVIGATION_LABELS.items():
            with self.subTest(language=language):
                reply = menu.MenuManager._render_reply_keyboard(keyboard, True, True, language)
                inline = menu.MenuManager._render_inline_keyboard(keyboard, True, True, language)
                self.assertEqual(reply, ["/test", f"{back}, {main}"])
                self.assertEqual(inline[-1], [[back, menu.BACK_COMMAND], [main, menu.MAIN_COMMAND]])
                self.assertEqual(menu.MenuManager.navigation_command(back), menu.BACK_COMMAND)
                self.assertEqual(menu.MenuManager.navigation_command(main), menu.MAIN_COMMAND)
                self.assertEqual(menu.MenuManager._render_reply_keyboard(keyboard, True, False, language), ["/test"])
                self.assertEqual(menu.MenuManager._render_inline_keyboard(keyboard, True, False, language), [[["/test", "/test"]]])
        self.assertIsNone(menu.MenuManager.navigation_command("/back"))
        self.assertIsNone(menu.MenuManager.navigation_command("/retour"))

    def test_send_uses_global_language_and_preserves_chat_history(self):
        async def run():
            call = AsyncMock()
            hass = types.SimpleNamespace(services=types.SimpleNamespace(async_call=call))
            entry = types.SimpleNamespace(data={
                "language": "fr", "chat_id": "1", "notify_entity": "notify.test",
                "menus": {"main": {"rows": []}, "sub": {"rows": []}},
            })
            manager = menu.MenuManager(hass, entry)
            await manager.show_menu("main")
            await manager.open_submenu("sub")
            payload = call.call_args.args[2]
            self.assertEqual(payload["keyboard"], ["⬅️ Retour, 🏠 Menu principal"])
            self.assertEqual(payload["message"], "Veuillez sélectionner :")
            await manager.go_main()
            self.assertEqual(manager._navigation_stacks["1"], ["main"])
            self.assertNotIn("keyboard", call.call_args.kwargs)
            await manager.open_submenu("sub", "2")
            await manager.go_back("2")
            self.assertEqual(manager._navigation_stacks["1"], ["main"])
            self.assertEqual(manager._navigation_stacks["2"], ["main"])
        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
