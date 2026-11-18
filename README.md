# Telegram Menu for Home Assistant

Custom Home Assistant integration for managing Telegram keyboards and button actions on top of the official `telegram_bot` integration.

## Features

- Reuses the configured Home Assistant `telegram_bot` integration and its notify entity; it does not replace polling, webhooks, or Telegram command events.
- Provides a Home Assistant sidebar panel for creating, editing, renaming, and deleting menus and buttons.
- Includes a responsive dashboard with sidebar navigation, menu/button counts, a menu list, integration settings, and a live Telegram preview. Colors follow the Home Assistant theme.
- Uses one language for the entire integration: German, English, or French, selected during initial setup. Menus do not have individual language settings; user-written menu names, messages, and commands are not translated.
- Supports Reply Keyboards and Inline Keyboards, with configurable menu messages and button commands.
- Supports submenu navigation with per-chat Back and Main menu controls.
- Can run a Home Assistant service action directly from a matching button command.
- Provides `telegram_menu.show` and `telegram_menu.hide` actions.
- Keeps existing automations using `telegram_command` events usable.

## Requirements and installation

The official Home Assistant `telegram_bot` integration must already be configured, including a Telegram notify entity.

### Install with HACS

1. Add `https://github.com/The-Fox23/telegram-menu-via-keyboard` as a custom HACS repository.
2. Select the **Integration** category and install **Telegram Menu via Keyboard**.
3. Restart Home Assistant and add **Telegram Menu via Keyboard** under **Settings > Devices & services > Add integration**.

### Configure

First select German, English, or French. Then choose the existing Telegram notify entity and set the default chat ID. Open **Telegram Menu** (localized in the selected language) in the Home Assistant sidebar.

The graphical editor lets you set the message and keyboard type, add or remove buttons, choose a Telegram command, optionally select a Home Assistant service and target entity, and save the configuration. The panel also includes a live keyboard preview; clicking a preview button tests its configured action or opens its submenu.

Enter a unique menu name in the menu list to create a menu. Use **Edit** to jump to a menu and update the preview, or rename/delete it from the list. Renaming updates submenu references; deleting a referenced submenu is blocked.

Under **Settings**, enable or disable automatic Back/Main menu buttons and click **Save**. This option applies to all menus, persists with the configuration, and defaults to enabled. With automatic navigation disabled, you can still create your own submenu buttons targeting `main` or another menu. Save menu changes before testing them in Telegram; the live preview can execute real Home Assistant actions.

### GitHub and HACS download versions

The development workspace must be committed and pushed to GitHub before its changes are available for download. HACS release downloads use the selected GitHub release/tag, which can differ from `main`. For unreleased changes on `main`, explicitly select the default branch when re-downloading in HACS; otherwise install the release containing the desired changes. After updating, restart Home Assistant and refresh the browser.

## Keyboard behavior

### Reply Keyboards

A Reply Keyboard sends the visible button text back as a message. The integration uses the configured Telegram command as that text, so existing automations listening for the same `telegram_command` can continue to work. The integration does not consume those events; if both an automation and a button action match, both may run.

### Inline Keyboards

Inline buttons send their configured command as callback data. The integration listens for Home Assistant `telegram_callback` events and routes matching commands to the configured button action or submenu.

### Submenus

A button can open another configured menu. Navigation history is tracked per Telegram chat, and submenu keyboards can offer **Back** and **Main menu** controls. Test navigation with your bot and chat before relying on it in important automations.

## Button actions and current limitations

A button can run a Home Assistant service directly, with an optional target entity. The graphical editor currently exposes one action and its target; it does not provide fields for arbitrary service data or multi-step action sequences. If a button configuration contains more than one action, only the first is executed.

Button commands are processed for the default chat ID configured in this integration. Existing `telegram_command` automations are not disabled or replaced.

## Actions

Show the main menu (or another named menu):

```yaml
action: telegram_menu.show
data:
  menu: main
```

Hide the Reply Keyboard:

```yaml
action: telegram_menu.hide
```

Both actions also accept an optional `chat_id`. The `show` action defaults to the `main` menu when `menu` is omitted.

## Telegram Bot privacy in groups

Telegram's Group Privacy setting can affect which messages a bot receives in a group. If Reply Keyboard commands are not reaching Home Assistant in a group, check the bot's settings with **@BotFather** (`/mybots` > your bot > **Bot Settings** > **Group Privacy**). Disable privacy only if your use case requires the bot to receive group messages; this setting is managed in BotFather, not in this integration.

## Development checks

To preview the panel with sample data and simulated, non-executing actions, serve the repository locally and open `http://127.0.0.1:8765/tests/panel-preview.html`.

Run the focused navigation tests with `python -m unittest discover -s tests -p "test_*.py" -v`.

The dependency-free browser tests are at `http://127.0.0.1:8765/tests/panel.html`. They exercise menu creation, edit/save, submenu references, DE/EN/FR localization, draft preservation, and responsive light/dark styling using a mock Home Assistant connection. They never call your real bot or devices.