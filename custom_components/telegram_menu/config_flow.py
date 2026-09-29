"""Config flow for Telegram Menu."""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_CHAT_ID,
    CONF_LANGUAGE,
    CONF_MENUS,
    CONF_NOTIFY_ENTITY,
    DEFAULT_LANGUAGE,
    DOMAIN,
)


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle the Telegram Menu config flow."""

    VERSION = 4

    def __init__(self) -> None:
        """Initialize the flow."""
        self._language = DEFAULT_LANGUAGE
        self._notify_entity = ""
        self._chat_id = ""

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Return the options flow."""
        return OptionsFlowHandler()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Select the language first."""
        if user_input is not None:
            self._language = str(user_input[CONF_LANGUAGE])
            return await self.async_step_connection()

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_LANGUAGE, default=DEFAULT_LANGUAGE
                ): vol.In({"de": "German", "en": "English", "fr": "French"})
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema)

    async def async_step_connection(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Configure the Telegram connection."""
        if user_input is not None:
            self._notify_entity = user_input[CONF_NOTIFY_ENTITY]
            self._chat_id = str(user_input[CONF_CHAT_ID])

            menus = {
                "main": {
                    "message": {
                        "de": "🏠 Bitte Funktion auswählen:",
                        "en": "🏠 Please select a function:",
                        "fr": "🏠 Veuillez sélectionner une fonction :",
                    }.get(self._language, "🏠 Please select a function:"),
                    "keyboard_type": "reply",
                    "rows": [],
                }
            }

            return self.async_create_entry(
                title="Telegram Menu",
                data={
                    CONF_LANGUAGE: self._language,
                    CONF_NOTIFY_ENTITY: self._notify_entity,
                    CONF_CHAT_ID: self._chat_id,
                    CONF_MENUS: menus,
                },
            )

        schema = vol.Schema(
            {
                vol.Required(CONF_NOTIFY_ENTITY): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain="notify")
                ),
                vol.Required(CONF_CHAT_ID): str,
            }
        )
        return self.async_show_form(step_id="connection", data_schema=schema)


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Handle Telegram Menu options."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Allow changing the language later."""
        current = self.config_entry.options.get(
            CONF_LANGUAGE,
            self.config_entry.data.get(CONF_LANGUAGE, DEFAULT_LANGUAGE),
        )
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_LANGUAGE, default=current
                ): vol.In({"de": "German", "en": "English", "fr": "French"})
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
