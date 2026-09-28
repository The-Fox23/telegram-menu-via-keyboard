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

  _getServices() { const out=[]; for (const [d,s] of Object.entries(this._hass?.services||{})) for (const n of Object.keys(s||{})) out.push({value:d+"."+n,label:d+"."+n}); return out.sort((a,b)=>a.label.localeCompare(b.label)); }

  async _previewButton(button) { const a=button?.actions?.[0]; if(!a?.action){this._error="Für diesen Button ist keine Home-Assistant-Aktion konfiguriert.";this._render();return;} try{const [d,s]=String(a.action).split(".",2); await this._hass.callService(d,s,a.data||{},a.target||{});this._error="";this._render();}catch(e){this._error=e?.message||"Aktion konnte nicht ausgeführt werden.";this._render();} }

  _renderPreview(menu) { const wrap=document.createElement("div"); const phone=document.createElement("div"); phone.className="preview-phone"; const top=document.createElement("div"); top.className="preview-top"; top.innerHTML="<span>Telegram</span><span>Vorschau</span>"; const screen=document.createElement("div"); screen.className="preview-screen"; const msg=document.createElement("div"); msg.className="preview-message"; msg.textContent=menu?.message||"Bitte auswählen:"; screen.appendChild(msg); const kb=document.createElement("div"); for(const row of menu?.rows||[]){const r=document.createElement("div");r.className="preview-row";for(const b of row){const p=document.createElement("button");p.className="preview-button";p.textContent=b?.label||b?.command||"Button";p.title=b?.command||"";p.addEventListener("click",()=>this._previewButton(b));r.appendChild(p);}kb.appendChild(r);} if(!(menu?.rows||[]).length){const e=document.createElement("div");e.className="preview-empty";e.textContent="Buttons erscheinen hier als Vorschau.";kb.appendChild(e);} screen.appendChild(kb);phone.append(top,screen);wrap.appendChild(phone);const h=document.createElement("div");h.className="preview-hint";h.textContent="Vorschau-Button führt die konfigurierte Home-Assistant-Aktion direkt aus.";wrap.appendChild(h);return wrap; }

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
          max-width: 1500px;
          margin: 0 auto;
        }

        .editor-layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(300px,.75fr); gap:22px; align-items:start; }\n        .preview-column { position:sticky; top:20px; }\n        .preview-card { background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color)); border:2px solid color-mix(in srgb,var(--primary-color) 40%,var(--divider-color)); border-radius:14px; padding:16px; box-shadow:var(--ha-box-shadow); }\n        .preview-title { font-size:18px; font-weight:700; margin-bottom:4px; }\n        .preview-subtitle,.preview-hint,.preview-empty { font-size:12px; color:var(--secondary-text-color); }\n        .preview-phone { border:2px solid var(--divider-color); border-radius:18px; overflow:hidden; background:var(--primary-background-color); }\n        .preview-top { display:flex; justify-content:space-between; padding:10px 12px; font-size:12px; font-weight:700; background:color-mix(in srgb,var(--primary-color) 15%,var(--card-background-color)); border-bottom:1px solid var(--divider-color); }\n        .preview-screen { padding:14px; } .preview-message { padding:10px 12px; border-radius:12px 12px 12px 4px; background:var(--card-background-color); border:1px solid var(--divider-color); margin-bottom:14px; font-size:13px; white-space:pre-wrap; }\n        .preview-row { display:flex; gap:6px; margin-bottom:6px; } .preview-button { flex:1; min-width:0; padding:9px 7px; border-radius:8px; background:color-mix(in srgb,var(--primary-color) 13%,var(--card-background-color)); color:var(--primary-color); border:1px solid color-mix(in srgb,var(--primary-color) 38%,var(--divider-color)); font-size:12px; }\n        .preview-hint { margin-top:12px; text-align:center; }\n        .version-badge { display:inline-flex; padding:4px 9px; margin-left:8px; border-radius:999px; background:color-mix(in srgb,var(--primary-color) 15%,var(--card-background-color)); border:1px solid color-mix(in srgb,var(--primary-color) 35%,var(--divider-color)); color:var(--primary-color); font-size:12px; font-weight:700; }\n\n        h1 {
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
          background: color-mix(in srgb, var(--primary-color) 4%, var(--card-background-color));
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 22px;
          box-shadow: var(--ha-box-shadow);
          border: 2px solid color-mix(in srgb, var(--primary-color) 45%, var(--divider-color));
        }

        .menu-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin: -20px -20px 18px;
          padding: 12px 14px;
          border-radius: 12px 12px 0 0;
          background: color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color));
          border-bottom: 1px solid color-mix(in srgb, var(--primary-color) 30%, var(--divider-color));
        }

        .menu-title {
          font-size: 21px;
          font-weight: 700;
          flex: 1;
          padding: 9px 12px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
          border-left: 5px solid var(--primary-color);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .field label {
          font-weight: 600;
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
          font-size: 17px;
          font-weight: 700;
          margin: 20px 0 12px;
          padding: 9px 12px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--secondary-color, var(--primary-color)) 10%, var(--card-background-color));
          border-left: 4px solid var(--secondary-color, var(--primary-color));
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
          padding: 12px;
          border: 1px dashed color-mix(in srgb, var(--secondary-color, var(--primary-color)) 35%, var(--divider-color));
          border-radius: 11px;
          background: color-mix(in srgb, var(--secondary-color, var(--primary-color)) 4%, var(--primary-background-color));
        }

        .button-editor {
          flex: 1 1 280px;
          min-width: 240px;
          padding: 15px;
          border: 2px solid color-mix(in srgb, var(--secondary-color, var(--primary-color)) 32%, var(--divider-color));
          border-radius: 11px;
          background: color-mix(in srgb, var(--secondary-color, var(--primary-color)) 7%, var(--card-background-color));
          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.16);
        }

        .button-editor:hover {
          border-color: color-mix(in srgb, var(--secondary-color, var(--primary-color)) 58%, var(--divider-color));
        }

        .button-editor .field {
          margin-bottom: 8px;
        }

        .action-title {
          font-size: 14px;
          font-weight: 700;
          margin: 14px 0 8px;
          padding: 8px 10px;
          border-radius: 7px;
          background: color-mix(in srgb, var(--warning-color, #ff9800) 12%, var(--card-background-color));
          color: var(--warning-color, #ff9800);
          border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 30%, var(--divider-color));
          border-left: 4px solid var(--warning-color, #ff9800);
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

        .button-editor .action-input,
        .button-editor .target-input {
          border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, var(--divider-color));
          background: color-mix(in srgb, var(--warning-color, #ff9800) 4%, var(--secondary-background-color));
        }

        .button-editor .action-input:focus,
        .button-editor .target-input:focus {
          outline: 2px solid color-mix(in srgb, var(--warning-color, #ff9800) 35%, transparent);
          outline-offset: 1px;
        }

        .save-footer {
          display: flex;
          justify-content: flex-end;
          margin: 30px 0 12px;
          padding: 16px;
          border: 2px solid color-mix(in srgb, var(--success-color, var(--primary-color)) 35%, var(--divider-color));
          border-radius: 12px;
          background: color-mix(in srgb, var(--success-color, var(--primary-color)) 6%, var(--card-background-color));
        }

        .save-footer button {
          min-width: 180px;
          font-size: 15px;
          font-weight: 700;
          background: var(--success-color, var(--primary-color));
          color: var(--text-primary-color, white);
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

        @media (max-width: 900px) { .editor-layout{grid-template-columns:1fr;} .preview-column{position:static;} }\n\n        @media (max-width: 600px) {
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
        </div>

        ${this._loading ? '<div class="status">Konfiguration wird geladen …</div>' : ""}
        ${this._error ? `<div class="status error">${this._escape(this._error)}</div>` : ""}
        ${this._saved ? '<div class="status success">Änderungen gespeichert.</div>' : ""}

        <div id="content"></div>
        <div class="save-footer">
          <button id="save">Speichern</button>
        </div>
      </div>
    `;

    const content = this.querySelector("#content");\n    const previewHost = this.querySelector("#preview");

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

        const start = document.createElement("button");
        start.className = "secondary";
        start.textContent = "▶ Tastatur starten";
        start.addEventListener("click", async () => {
          try {
            await this._hass.callService("telegram_menu", "show", { menu: name });
            this._error = "";
            this._started = name;
            this._render();
          } catch (error) {
            this._error = error?.message || "Tastatur konnte nicht gestartet werden.";
            this._render();
          }
        });

        const remove = document.createElement("button");
        remove.className = "danger";
        remove.textContent = "Löschen";
        remove.addEventListener("click", () => this._deleteMenu(name));

        header.append(title, start, rename, remove);
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

        if (previewHost && !previewHost.childElementCount) previewHost.appendChild(this._renderPreview(menu));\n\n        const buttonsTitle = document.createElement("div");
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

            const actionSelect=document.createElement("select"); actionSelect.className="action-select"; actionSelect.innerHTML="<option value=\"\">Dienst/Aktion auswählen …</option>"; const currentAction=actionInput.value; for(const service of this._getServices()){const o=document.createElement("option");o.value=service.value;o.textContent=service.label;actionSelect.appendChild(o);} if(currentAction && ![...actionSelect.options].some(o=>o.value===currentAction)){const o=document.createElement("option");o.value=currentAction;o.textContent=currentAction+" (gespeichert)";actionSelect.appendChild(o);} actionSelect.value=currentAction; actionSelect.addEventListener("change",()=>actionInput.value=actionSelect.value); actionInput.style.marginTop="6px"; actionField.append(actionLabel,actionSelect,actionInput);

            const targetField = document.createElement("div");
            targetField.className = "field";

            const targetLabel = document.createElement("label");
            targetLabel.textContent = "Ziel-Entity";

            const targetInput = document.createElement("input");
            targetInput.className = "target-input";
            targetInput.placeholder = "Entity suchen oder auswählen …";
            targetInput.setAttribute("list", "entity-list");
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

    const entityList = document.createElement("datalist");
    entityList.id = "entity-list";
    for (const [entityId, state] of Object.entries(this._hass?.states || {})) {
      const option = document.createElement("option");
      option.value = entityId;
      const friendlyName = state?.attributes?.friendly_name;
      if (friendlyName) option.label = friendlyName;
      entityList.appendChild(option);
    }
    this.appendChild(entityList);
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
