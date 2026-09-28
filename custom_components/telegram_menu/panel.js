class TelegramMenuPanel extends HTMLElement {
  set hass(value) {
    this._hass = value;
    if (!this._loaded) {
      this._loadConfig();
    }
  }

  set panel(value) {
    this._panelConfig = value;
    this._render();
  }

  connectedCallback() {
    this._render();
    this._loadConfig();
  }

  async _loadConfig() {
    if (this._loading || !this._hass?.connection) return;
    this._loading = true;
    this._render();

    try {
      const response = await this._hass.connection.sendMessagePromise({
        type: "telegram_menu/get_config",
      });
      this._config = response;
      this._loaded = true;
      this._error = "";
      this._render();
    } catch (error) {
      this._error = error?.message || "Konfiguration konnte nicht geladen werden.";
      this._render();
    } finally {
      this._loading = false;
    }
  }

  async _saveConfig() {
    if (!this._hass?.connection) return;

    const menus = this._collectMenus();
    const saveButton = this.querySelector("#save");
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "Speichern …";
    }

    try {
      const response = await this._hass.connection.sendMessagePromise({
        type: "telegram_menu/save_config",
        menus,
      });
      this._config = { ...this._config, menus: response.menus };
      this._error = "";
      this._saved = true;
      this._render();
    } catch (error) {
      this._saved = false;
      this._error = error?.message || "Speichern fehlgeschlagen.";
      this._render();
    }
  }

  _collectMenus() {
    const menus = {};

    for (const card of this.querySelectorAll(".menu-card")) {
      const name = card.dataset.name?.trim();
      if (!name) continue;

      const rows = [];
      for (const row of card.querySelectorAll(".button-row")) {
        const rowButtons = [];

        for (const button of row.querySelectorAll(".button-editor")) {
          const label = button.querySelector(".label-input")?.value.trim() || "";
          const command = button.querySelector(".command-input")?.value.trim() || "";
          const action = button.querySelector(".action-input")?.value.trim() || "";
          const target = button.querySelector(".target-input")?.value.trim() || "";

          const buttonConfig = { label, command };
          if (action) {
            buttonConfig.actions = [{
              action,
              ...(target ? { target: { entity_id: [target] } } : {}),
            }];
          }

          if (label || command) {
            rowButtons.push(buttonConfig);
          }
        }

        if (rowButtons.length) rows.push(rowButtons);
      }

      menus[name] = {
        message: card.querySelector(".message-input")?.value || "",
        keyboard_type: card.querySelector(".keyboard-type")?.value || "reply",
        rows,
      };
    }

    return menus;
  }

  _createMenu() {
    const menus = this._collectMenus();
    let number = Object.keys(menus).length + 1;
    let name = number === 1 ? "main" : `menu_${number}`;

    while (menus[name]) {
      number += 1;
      name = `menu_${number}`;
    }

    menus[name] = {
      message: "Bitte auswählen:",
      keyboard_type: "reply",
      rows: [],
    };

    this._config = { ...this._config, menus };
    this._saved = false;
    this._render();
  }

  _deleteMenu(name) {
    if (!confirm(`Menü "${name}" wirklich löschen?`)) return;

    const menus = this._collectMenus();
    delete menus[name];

    this._config = { ...this._config, menus };
    this._saved = false;
    this._render();
  }

  _renameMenu(oldName) {
    const newName = prompt("Neuer Menüname:", oldName);
    if (!newName?.trim() || newName.trim() === oldName) return;

    const menus = this._collectMenus();
    const name = newName.trim();

    if (menus[name]) {
      alert("Ein Menü mit diesem Namen existiert bereits.");
      return;
    }

    menus[name] = menus[oldName];
    delete menus[oldName];

    this._config = { ...this._config, menus };
    this._saved = false;
    this._render();
  }

  _addButton(name) {
    const menus = this._collectMenus();
    const menu = menus[name];
    if (!menu) return;

    if (!menu.rows.length) menu.rows.push([]);

    menu.rows[menu.rows.length - 1].push({
      label: "Neuer Button",
      command: "/neuer_button",
    });

    this._config = { ...this._config, menus };
    this._saved = false;
    this._render();
  }

  _deleteButton(name, rowIndex, buttonIndex) {
    const menus = this._collectMenus();
    const menu = menus[name];
    if (!menu?.rows[rowIndex]) return;

    menu.rows[rowIndex].splice(buttonIndex, 1);

    if (!menu.rows[rowIndex].length) {
      menu.rows.splice(rowIndex, 1);
    }

    this._config = { ...this._config, menus };
    this._saved = false;
    this._render();
  }

  _render() {
    if (!this.isConnected) return;

    const menus = this._config?.menus || {};
    const menuEntries = Object.entries(menus);

    this.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          padding: 24px;
          background: var(--primary-background-color);
          color: var(--primary-text-color);
          min-height: 100vh;
          font-family: var(--paper-font-body1_-_font-family, sans-serif);
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
        }

        h1 {
          margin: 0 0 4px;
          font-size: 28px;
        }

        .subtitle {
          color: var(--secondary-text-color);
          margin-bottom: 20px;
        }

        .toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        button {
          border: 0;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          background: var(--primary-color);
          color: var(--text-primary-color, white);
        }

        button.secondary {
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
          border: 1px solid var(--divider-color);
        }

        button.danger {
          background: var(--error-color);
          color: white;
        }

        button:disabled {
          opacity: .6;
          cursor: default;
        }

        .status {
          padding: 10px 14px;
          border-radius: 8px;
          background: var(--secondary-background-color);
          color: var(--secondary-text-color);
          margin-bottom: 20px;
        }

        .error {
          color: var(--error-color);
        }

        .success {
          color: var(--success-color, var(--primary-color));
        }

        .menu-card {
          background: var(--card-background-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: var(--ha-box-shadow);
        }

        .menu-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .menu-title {
          font-size: 21px;
          font-weight: 600;
          flex: 1;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        label {
          font-size: 13px;
          color: var(--secondary-text-color);
        }

        input,
        select {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 10px 12px;
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
          font: inherit;
        }

        .buttons-title {
          font-size: 16px;
          font-weight: 600;
          margin: 18px 0 10px;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
          padding: 12px;
          border: 1px solid rgba(128, 128, 128, 0.28);
          border-radius: 10px;
          background: rgba(128, 128, 128, 0.07);
        }

        .button-editor {
          flex: 1 1 280px;
          min-width: 240px;
          padding: 14px;
          border: 1px solid rgba(128, 128, 128, 0.38);
          border-radius: 10px;
          background: rgba(128, 128, 128, 0.14);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
        }

        .button-editor .field {
          margin-bottom: 8px;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          margin: 14px 0 8px;
        }

        .action-help {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 8px;
        }

        .button-actions {
          display: flex;
          justify-content: flex-end;
        }

        .empty {
          background: var(--card-background-color);
          border-radius: 12px;
          padding: 28px;
          text-align: center;
          box-shadow: var(--ha-box-shadow);
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .empty-text {
          color: var(--secondary-text-color);
          margin-bottom: 18px;
        }

        .menu-help {
          padding: 10px 14px;
          border-radius: 8px;
          background: var(--secondary-background-color);
          color: var(--secondary-text-color);
          margin-bottom: 16px;
        }

        @media (max-width: 600px) {
          :host {
            padding: 12px;
          }

          .menu-card {
            padding: 14px;
          }

          .button-editor {
            min-width: 100%;
          }
        }
      </style>

      <div class="container">
        <h1>Telegram Menu</h1>
        <div class="subtitle">Menüs und Buttons grafisch bearbeiten</div>

        <div class="toolbar">
          <button id="add-menu">+ Menü erstellen</button>
          <button id="save">Speichern</button>
        </div>

        ${this._loading ? '<div class="status">Konfiguration wird geladen …</div>' : ""}
        ${this._error ? `<div class="status error">${this._escape(this._error)}</div>` : ""}
        ${this._saved ? '<div class="status success">Änderungen gespeichert.</div>' : ""}

        <div id="content"></div>
      </div>
    `;

    const content = this.querySelector("#content");

    if (!menuEntries.length && !this._loading && !this._error) {
      content.innerHTML = `
        <div class="empty">
          <div class="empty-title">Noch kein Telegram-Menü vorhanden</div>
          <div class="empty-text">
            Erstelle zuerst ein Menü. Danach kannst du darin beliebig viele Telegram-Buttons anlegen.
          </div>
          <button id="create-first-menu">+ Erstes Menü erstellen</button>
        </div>
      `;

      this.querySelector("#create-first-menu")?.addEventListener(
        "click",
        () => this._createMenu(),
      );
    } else {
      for (const [name, menu] of menuEntries) {
        const card = document.createElement("section");
        card.className = "menu-card";
        card.dataset.name = name;

        const header = document.createElement("div");
        header.className = "menu-header";

        const title = document.createElement("div");
        title.className = "menu-title";
        title.textContent = name;

        const rename = document.createElement("button");
        rename.className = "secondary";
        rename.textContent = "Umbenennen";
        rename.addEventListener("click", () => this._renameMenu(name));

        const remove = document.createElement("button");
        remove.className = "danger";
        remove.textContent = "Löschen";
        remove.addEventListener("click", () => this._deleteMenu(name));

        header.append(title, rename, remove);
        card.appendChild(header);

        const help = document.createElement("div");
        help.className = "menu-help";
        help.textContent = "Hier kannst du die Menü-Nachricht, den Tastaturtyp und die Telegram-Buttons konfigurieren.";
        card.appendChild(help);

        const messageField = document.createElement("div");
        messageField.className = "field";
        messageField.innerHTML = "<label>Nachricht über der Tastatur</label>";

        const messageInput = document.createElement("input");
        messageInput.className = "message-input";
        messageInput.value = menu?.message || "";
        messageField.appendChild(messageInput);
        card.appendChild(messageField);

        const typeField = document.createElement("div");
        typeField.className = "field";
        typeField.innerHTML = "<label>Tastaturtyp</label>";

        const typeSelect = document.createElement("select");
        typeSelect.className = "keyboard-type";
        typeSelect.innerHTML = `
          <option value="reply">Normale Telegram-Tastatur</option>
          <option value="inline">Inline-Tastatur</option>
        `;
        typeSelect.value = menu?.keyboard_type || "reply";
        typeField.appendChild(typeSelect);
        card.appendChild(typeField);

        const buttonsTitle = document.createElement("div");
        buttonsTitle.className = "buttons-title";
        buttonsTitle.textContent = "Buttons";
        card.appendChild(buttonsTitle);

        for (let rowIndex = 0; rowIndex < (menu?.rows || []).length; rowIndex++) {
          const row = menu.rows[rowIndex];
          const rowElement = document.createElement("div");
          rowElement.className = "button-row";

          for (let buttonIndex = 0; buttonIndex < row.length; buttonIndex++) {
            const button = row[buttonIndex];
            const editor = document.createElement("div");
            editor.className = "button-editor";

            const labelField = document.createElement("div");
            labelField.className = "field";
            labelField.innerHTML = "<label>Anzeigename</label>";

            const labelInput = document.createElement("input");
            labelInput.className = "label-input";
            labelInput.value = button?.label || button?.command || "";
            labelField.appendChild(labelInput);

            const commandField = document.createElement("div");
            commandField.className = "field";
            commandField.innerHTML = "<label>Telegram-Befehl</label>";

            const commandInput = document.createElement("input");
            commandInput.className = "command-input";
            commandInput.value = button?.command || "";
            commandField.appendChild(commandInput);

            const actionTitle = document.createElement("div");
            actionTitle.className = "action-title";
            actionTitle.textContent = "Home-Assistant-Aktion";

            const actionHelp = document.createElement("div");
            actionHelp.className = "action-help";
            actionHelp.textContent = "Optional: einen Home-Assistant-Dienst direkt mit diesem Button ausführen.";

            const actionField = document.createElement("div");
            actionField.className = "field";

            const actionLabel = document.createElement("label");
            actionLabel.textContent = "Dienst / Aktion";

            const actionInput = document.createElement("input");
            actionInput.className = "action-input";
            actionInput.placeholder = "z. B. light.turn_on";
            actionInput.value = button?.actions?.[0]?.action || "";

            actionField.append(actionLabel, actionInput);

            const targetField = document.createElement("div");
            targetField.className = "field";

            const targetLabel = document.createElement("label");
            targetLabel.textContent = "Ziel-Entity";

            const targetInput = document.createElement("input");
            targetInput.className = "target-input";
            targetInput.placeholder = "z. B. light.garage";
            targetInput.value =
              button?.actions?.[0]?.target?.entity_id?.[0] || "";

            targetField.append(targetLabel, targetInput);

            const actions = document.createElement("div");
            actions.className = "button-actions";

            const removeButton = document.createElement("button");
            removeButton.className = "danger";
            removeButton.textContent = "Button löschen";
            removeButton.addEventListener(
              "click",
              () => this._deleteButton(name, rowIndex, buttonIndex),
            );

            actions.appendChild(removeButton);
            editor.append(
              labelField,
              commandField,
              actionTitle,
              actionHelp,
              actionField,
              targetField,
              actions,
            );
            rowElement.appendChild(editor);
          }

          card.appendChild(rowElement);
        }

        const addButton = document.createElement("button");
        addButton.className = "secondary";
        addButton.textContent = "+ Button erstellen";
        addButton.addEventListener("click", () => this._addButton(name));
        card.appendChild(addButton);

        content.appendChild(card);
      }
    }

    this.querySelector("#add-menu")?.addEventListener(
      "click",
      () => this._createMenu(),
    );

    this.querySelector("#save")?.addEventListener(
      "click",
      () => this._saveConfig(),
    );
  }

  _escape(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
}

if (!customElements.get("telegram-menu-panel")) {
  customElements.define("telegram-menu-panel", TelegramMenuPanel);
}
