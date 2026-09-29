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
    this._ensureNativeEntitySelector();
  }

  async _ensureNativeEntitySelector() {
    if (customElements.get("ha-selector")) return;

    // Home Assistant lazy-loads the native selector. This mirrors the
    // pattern used by HA's own/custom frontend editors to trigger loading.
    for (const tag of ["hui-entities-card", "hui-tile-card"]) {
      const element = customElements.get(tag);
      if (element?.getConfigElement) {
        try {
          await element.getConfigElement();
        } catch (_error) {
          // Fall back to the searchable HTML picker below.
        }
        if (customElements.get("ha-selector")) {
          this._render();
          return;
        }
      }
    }
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
      this._error = error?.message || this._t("loadFailed");
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
      saveButton.textContent = this._t("save") + " …";
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
      this._error = error?.message || this._t("saveFailed");
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
          let command = button.querySelector(".command-input")?.value.trim() || "";
          const action = button.querySelector(".action-input")?.value.trim() || "";
          const target = button.querySelector(".target-input")?.value.trim() || "";

          if (command && !command.startsWith("/")) {
            command = "/" + command;
          }

          const buttonConfig = { command };
          if (action) {
            buttonConfig.actions = [{
              action,
              ...(target ? { target: { entity_id: [target] } } : {}),
            }];
          }

          if (command) {
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
      message: this._t("defaultMessage"),
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
    const newName = prompt(this._t("newMenuName"), oldName);
    if (!newName?.trim() || newName.trim() === oldName) return;

    const menus = this._collectMenus();
    const name = newName.trim();

    if (menus[name]) {
      alert(this._t("duplicateMenu"));
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
      command: this._t("newButton"),
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

  _t(key) {
    const language = this._panelConfig?.language || "en";
    const texts = {"de":{"title":"Telegram Menü","subtitle":"Menüs und Buttons grafisch bearbeiten – jeder Button verwendet ausschließlich den Telegram-Command.","createMenu":"+ Menü erstellen","loading":"Konfiguration wird geladen …","saved":"Änderungen gespeichert.","preview":"Live-Vorschau","previewSubtitle":"Die Buttons zeigen und senden ausschließlich den konfigurierten Telegram-Command.","save":"Speichern","rename":"Umbenennen","start":"▶ Tastatur starten","delete":"Löschen","menuHelp":"Hier kannst du die Menü-Nachricht, den Tastaturtyp und die Telegram-Buttons konfigurieren.","message":"Nachricht über der Tastatur","keyboardType":"Tastaturtyp","reply":"Normale Telegram-Tastatur","inline":"Inline-Tastatur","buttons":"Buttons","command":"Telegram-Befehl","action":"Home-Assistant-Aktion","actionHelp":"Optional: einen Home-Assistant-Dienst direkt mit diesem Button ausführen.","service":"Dienst / Aktion","chooseService":"Dienst/Aktion auswählen …","target":"Ziel-Entity","entityPlaceholder":"Entity suchen …","deleteButton":"Button löschen","createButton":"+ Button erstellen","emptyTitle":"Noch kein Telegram-Menü vorhanden","emptyText":"Erstelle zuerst ein Menü. Danach kannst du darin beliebig viele Telegram-Buttons anlegen.","createFirst":"+ Erstes Menü erstellen","emptyPreview":"Buttons erscheinen hier als Vorschau.","previewHint":"Die Buttons sind anklickbar und führen die konfigurierte Home-Assistant-Aktion direkt aus.","noAction":"Für diesen Button ist keine Home-Assistant-Aktion konfiguriert.","actionFailed":"Aktion konnte nicht ausgeführt werden.","startFailed":"Tastatur konnte nicht gestartet werden.","saveFailed":"Speichern fehlgeschlagen.","loadFailed":"Konfiguration konnte nicht geladen werden.","newMenuName":"Neuer Menüname:","duplicateMenu":"Ein Menü mit diesem Namen existiert bereits.","newButton":"/neuer_button","defaultMessage":"Bitte auswählen:","actionStored":"{action} (gespeichert)","testAction":"Aktion testen"},"en":{"title":"Telegram Menu","subtitle":"Edit menus and buttons graphically – each button uses only the Telegram command.","createMenu":"+ Create menu","loading":"Loading configuration …","saved":"Changes saved.","preview":"Live preview","previewSubtitle":"Buttons display and send only the configured Telegram command.","save":"Save","rename":"Rename","start":"▶ Start keyboard","delete":"Delete","menuHelp":"Configure the menu message, keyboard type and Telegram buttons here.","message":"Message above the keyboard","keyboardType":"Keyboard type","reply":"Normal Telegram keyboard","inline":"Inline keyboard","buttons":"Buttons","command":"Telegram command","action":"Home Assistant action","actionHelp":"Optional: execute a Home Assistant service directly with this button.","service":"Service / action","chooseService":"Select service/action …","target":"Target entity","entityPlaceholder":"Search entity …","deleteButton":"Delete button","createButton":"+ Create button","emptyTitle":"No Telegram menu yet","emptyText":"Create a menu first. You can then add any number of Telegram buttons.","createFirst":"+ Create first menu","emptyPreview":"Buttons will appear here as a preview.","previewHint":"The buttons are clickable and directly execute the configured Home Assistant action.","noAction":"No Home Assistant action is configured for this button.","actionFailed":"Action could not be executed.","startFailed":"Keyboard could not be started.","saveFailed":"Saving failed.","loadFailed":"Configuration could not be loaded.","newMenuName":"New menu name:","duplicateMenu":"A menu with this name already exists.","newButton":"/new_button","defaultMessage":"Please select:","actionStored":"{action} (saved)","testAction":"Test action"},"fr":{"title":"Menu Telegram","subtitle":"Modifier graphiquement les menus et les boutons – chaque bouton utilise uniquement la commande Telegram.","createMenu":"+ Créer un menu","loading":"Chargement de la configuration …","saved":"Modifications enregistrées.","preview":"Aperçu en direct","previewSubtitle":"Les boutons affichent et envoient uniquement la commande Telegram configurée.","save":"Enregistrer","rename":"Renommer","start":"▶ Démarrer le clavier","delete":"Supprimer","menuHelp":"Configurez ici le message du menu, le type de clavier et les boutons Telegram.","message":"Message au-dessus du clavier","keyboardType":"Type de clavier","reply":"Clavier Telegram normal","inline":"Clavier intégré","buttons":"Boutons","command":"Commande Telegram","action":"Action Home Assistant","actionHelp":"Facultatif : exécuter directement un service Home Assistant avec ce bouton.","service":"Service / action","chooseService":"Sélectionner un service/une action …","target":"Entité cible","entityPlaceholder":"Rechercher une entité …","deleteButton":"Supprimer le bouton","createButton":"+ Créer un bouton","emptyTitle":"Aucun menu Telegram","emptyText":"Créez d'abord un menu. Vous pourrez ensuite ajouter autant de boutons Telegram que nécessaire.","createFirst":"+ Créer le premier menu","emptyPreview":"Les boutons apparaîtront ici en aperçu.","previewHint":"Les boutons sont cliquables et exécutent directement l'action Home Assistant configurée.","noAction":"Aucune action Home Assistant n'est configurée pour ce bouton.","actionFailed":"L'action n'a pas pu être exécutée.","startFailed":"Le clavier n'a pas pu être démarré.","saveFailed":"Échec de l'enregistrement.","loadFailed":"Impossible de charger la configuration.","newMenuName":"Nouveau nom du menu :","duplicateMenu":"Un menu portant ce nom existe déjà.","newButton":"/nouveau_bouton","defaultMessage":"Veuillez sélectionner :","actionStored":"{action} (enregistré)","testAction":"Tester l'action"}};
    return texts[language]?.[key] ?? texts.en[key] ?? key;
  }

  _format(key, values = {}) {
    let value = this._t(key);
    for (const [name, replacement] of Object.entries(values)) {
      value = value.replace("{" + name + "}", replacement);
    }
    return value;
  }
  _getServices() {
    const out = [];
    for (const [domain, services] of Object.entries(this._hass?.services || {})) {
      for (const name of Object.keys(services || {})) {
        out.push({ value: domain + "." + name, label: domain + "." + name });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }

  _createEntityPicker(value) {
    const wrapper = document.createElement("div");
    wrapper.className = "entity-picker-wrapper";

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.className = "target-input";
    hidden.value = value || "";
    wrapper.appendChild(hidden);

    if (customElements.get("ha-selector")) {
      const selector = document.createElement("ha-selector");
      selector.hass = this._hass;
      selector.selector = { entity: { multiple: false } };
      selector.value = value || "";
      selector.label = "Ziel-Entity";
      selector.helper = "Nach Anzeigename oder Entity-ID suchen.";
      selector.addEventListener("value-changed", (event) => {
        hidden.value = event.detail?.value || "";
      });
      wrapper.appendChild(selector);
      return wrapper;
    }

    // Fallback for frontend states where HA has not lazy-loaded ha-selector yet.
    const input = document.createElement("input");
    input.className = "entity-search-fallback";
    input.placeholder = this._t("entityPlaceholder");
    input.value = value || "";

    const list = document.createElement("div");
    list.className = "entity-search-list";

    const entities = Object.entries(this._hass?.states || {})
      .map(([entityId, state]) => ({
        entityId,
        name: state?.attributes?.friendly_name || entityId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const renderMatches = () => {
      const query = input.value.trim().toLowerCase();
      list.innerHTML = "";
      const matches = entities
        .filter((item) =>
          !query ||
          item.entityId.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
        )
        .slice(0, 25);

      for (const item of matches) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "entity-search-option";
        option.innerHTML = "<strong>" + this._escape(item.name) +
          "</strong><span>" + this._escape(item.entityId) + "</span>";
        option.addEventListener("click", () => {
          input.value = item.entityId;
          hidden.value = item.entityId;
          list.hidden = true;
        });
        list.appendChild(option);
      }
      list.hidden = matches.length === 0;
    };

    input.addEventListener("input", () => {
      hidden.value = input.value.trim();
      renderMatches();
    });
    input.addEventListener("focus", renderMatches);
    input.addEventListener("blur", () => {
      setTimeout(() => { list.hidden = true; }, 150);
    });

    wrapper.append(input, list);
    return wrapper;
  }

  async _previewButton(button) { const a=button?.actions?.[0]; if(!a?.action){this._error=this._t("noAction");this._render();return;} try{const [d,s]=String(a.action).split(".",2); await this._hass.callService(d,s,a.data||{},a.target||{});this._error="";this._render();}catch(e){this._error=e?.message||this._t("actionFailed");this._render();} }

  _renderPreview(menu) {
    const wrap = document.createElement("div");
    const phone = document.createElement("div");
    phone.className = "preview-phone";

    const top = document.createElement("div");
    top.className = "preview-top";
    top.innerHTML = "<span>Telegram</span><span>" + this._t("preview") + "</span>";

    const screen = document.createElement("div");
    screen.className = "preview-screen";

    const msg = document.createElement("div");
    msg.className = "preview-message";
    msg.textContent = menu?.message || this._t("defaultMessage");
    screen.appendChild(msg);

    const kb = document.createElement("div");
    kb.className = "preview-keyboard";

    for (const row of menu?.rows || []) {
      const rowElement = document.createElement("div");
      rowElement.className = "preview-row";

      for (const button of row) {
        const previewButton = document.createElement("button");
        previewButton.type = "button";
        previewButton.className = "preview-button";
        previewButton.textContent = button?.command || "Button";
        previewButton.title = button?.command || this._t("testAction");
        previewButton.addEventListener("click", () => this._previewButton(button));
        rowElement.appendChild(previewButton);
      }

      kb.appendChild(rowElement);
    }

    if (!(menu?.rows || []).length) {
      const empty = document.createElement("div");
      empty.className = "preview-empty";
      empty.textContent = this._t("emptyPreview");
      kb.appendChild(empty);
    }

    screen.appendChild(kb);
    phone.append(top, screen);
    wrap.appendChild(phone);

    const hint = document.createElement("div");
    hint.className = "preview-hint";
    hint.textContent = this._t("previewHint");
    wrap.appendChild(hint);

    return wrap;
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
          max-width: 1500px;
          margin: 0 auto;
        }

        .editor-layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(300px,.75fr); gap:22px; align-items:start; }
        .preview-column { position:sticky; top:20px; }
        .preview-card { background:var(--card-background-color); border:2px solid var(--divider-color); border-radius:16px; padding:18px; box-shadow:var(--ha-box-shadow); }
        .preview-title { font-size:19px; font-weight:700; margin-bottom:5px; }
        .preview-subtitle { font-size:12px; line-height:1.45; color:var(--secondary-text-color); margin-bottom:16px; }
        .preview-phone { width:min(100%,360px); min-height:600px; margin:0 auto; box-sizing:border-box; border:8px solid var(--primary-text-color); border-radius:34px; overflow:hidden; background:var(--primary-background-color); box-shadow:0 0 0 2px var(--divider-color), 0 10px 30px rgba(0,0,0,.35); position:relative; }
        .preview-phone::before { content:""; display:block; width:92px; height:18px; margin:0 auto; background:var(--primary-text-color); border-radius:0 0 12px 12px; position:relative; z-index:2; }
        .preview-top { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; font-size:12px; font-weight:700; background:var(--secondary-background-color); color:var(--primary-text-color); border-bottom:1px solid var(--divider-color); }
        .preview-screen { min-height:540px; padding:16px 12px 14px; background:var(--primary-background-color); box-sizing:border-box; }
        .preview-message { max-width:88%; padding:11px 13px; border-radius:14px 14px 14px 4px; background:var(--card-background-color); border:1px solid var(--divider-color); margin:0 auto 18px 0; font-size:13px; line-height:1.4; white-space:pre-wrap; box-shadow:0 2px 5px rgba(0,0,0,.2); }
        .preview-row { display:flex; gap:7px; margin-bottom:7px; }
        .preview-button { flex:1; min-width:0; padding:10px 8px; border-radius:9px; background:var(--secondary-background-color); color:var(--primary-text-color); border:2px solid var(--primary-color); font-size:12px; font-weight:600; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,.25); transition:transform .08s ease, background .08s ease, box-shadow .08s ease; }
        .preview-button:hover { background:var(--primary-color); color:var(--text-primary-color,white); }
        .preview-button:active { transform:translateY(2px); box-shadow:0 0 1px rgba(0,0,0,.25); }
        .preview-empty { padding:14px; border:1px dashed var(--divider-color); border-radius:10px; text-align:center; color:var(--secondary-text-color); font-size:12px; }
        .preview-hint { margin-top:14px; text-align:center; font-size:12px; line-height:1.4; color:var(--secondary-text-color); }
        .version-badge { display:inline-flex; padding:4px 9px; margin-left:8px; border-radius:999px; background:color-mix(in srgb,var(--primary-color) 15%,var(--card-background-color)); border:1px solid color-mix(in srgb,var(--primary-color) 35%,var(--divider-color)); color:var(--primary-color); font-size:12px; font-weight:700; }

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
        .button-editor .target-input,
        .button-editor .entity-search-fallback {
          border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, var(--divider-color));
          background: color-mix(in srgb, var(--warning-color, #ff9800) 4%, var(--secondary-background-color));
        }

        .button-editor .action-input:focus,
        .button-editor .target-input:focus,
        .button-editor .entity-search-fallback:focus {
          outline: 2px solid color-mix(in srgb, var(--warning-color, #ff9800) 35%, transparent);
          outline-offset: 1px;
        }

        .entity-picker-wrapper { position:relative; width:100%; }
        .entity-picker-wrapper ha-selector { display:block; width:100%; }
        .entity-search-list { position:absolute; z-index:20; left:0; right:0; top:calc(100% + 4px); max-height:260px; overflow:auto; background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:8px; box-shadow:var(--ha-box-shadow); }
        .entity-search-option { display:flex; flex-direction:column; align-items:flex-start; width:100%; padding:9px 11px; border:0; border-bottom:1px solid var(--divider-color); border-radius:0; background:transparent; color:var(--primary-text-color); text-align:left; }
        .entity-search-option:hover { background:var(--secondary-background-color); }
        .entity-search-option span { font-size:11px; color:var(--secondary-text-color); margin-top:2px; }
        
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
          min-height: 44px;
          padding: 10px 22px;
          font-size: 15px;
          font-weight: 700;
          background: var(--primary-color) !important;
          color: #fff !important;
          border: 2px solid var(--primary-color) !important;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: var(--ha-box-shadow);
        }
        .save-footer button:hover {
          filter: brightness(1.08);
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

        @media (max-width: 900px) { .editor-layout{grid-template-columns:1fr;} .preview-column{position:static;} }

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
        <h1>${this._t("title")}</h1>
        <div class="subtitle">${this._t("subtitle")}</div>

        <div class="toolbar">
          <button id="add-menu">${this._t("createMenu")}</button>
        </div>

        ${this._loading ? `<div class="status">${this._t("loading")}</div>` : ""}
        ${this._error ? `<div class="status error">${this._escape(this._error)}</div>` : ""}
        ${this._saved ? `<div class="status success">${this._t("saved")}</div>` : ""}

        <div class="editor-layout">
          <div id="content"></div>
          <div class="preview-column">
            <div class="preview-card">
              <div class="preview-title">${this._t("preview")}</div>
              <div class="preview-subtitle">${this._t("previewSubtitle")}</div>
              <div id="preview"></div>
            </div>
          </div>
        </div>
        <div class="save-footer">
          <button id="save">${this._t("save")}</button>
        </div>
      </div>
    `;

    const content = this.querySelector("#content");
    const previewHost = this.querySelector("#preview");

    if (!menuEntries.length && !this._loading && !this._error) {
      content.innerHTML = `
        <div class="empty">
          <div class="empty-title">${this._t("emptyTitle")}</div>
          <div class="empty-text">
            ${this._t("emptyText")}
          </div>
          <button id="create-first-menu">${this._t("createFirst")}</button>
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
        rename.textContent = this._t("rename");
        rename.addEventListener("click", () => this._renameMenu(name));

        const start = document.createElement("button");
        start.className = "secondary";
        start.textContent = this._t("start");
        start.addEventListener("click", async () => {
          try {
            await this._hass.callService("telegram_menu", "show", { menu: name });
            this._error = "";
            this._started = name;
            this._render();
          } catch (error) {
            this._error = error?.message || this._t("startFailed");
            this._render();
          }
        });

        const remove = document.createElement("button");
        remove.className = "danger";
        remove.textContent = this._t("delete");
        remove.addEventListener("click", () => this._deleteMenu(name));

        header.append(title, start, rename, remove);
        card.appendChild(header);

        const help = document.createElement("div");
        help.className = "menu-help";
        help.textContent = this._t("menuHelp");
        card.appendChild(help);

        const messageField = document.createElement("div");
        messageField.className = "field";
        messageField.innerHTML = "<label>" + this._t("message") + "</label>";

        const messageInput = document.createElement("input");
        messageInput.className = "message-input";
        messageInput.value = menu?.message || "";
        messageField.appendChild(messageInput);
        card.appendChild(messageField);

        const typeField = document.createElement("div");
        typeField.className = "field";
        typeField.innerHTML = "<label>" + this._t("keyboardType") + "</label>";

        const typeSelect = document.createElement("select");
        typeSelect.className = "keyboard-type";
        typeSelect.innerHTML = `
          <option value="reply">${this._t("reply")}</option>
          <option value="inline">${this._t("inline")}</option>
        `;
        typeSelect.value = menu?.keyboard_type || "reply";
        typeField.appendChild(typeSelect);
        card.appendChild(typeField);

        if (previewHost && !previewHost.childElementCount) {
          previewHost.appendChild(this._renderPreview(menu));
        }

        const liveUpdate = () => {
          if (!previewHost) return;
          previewHost.innerHTML = "";
          previewHost.appendChild(this._renderPreview(this._collectMenus()[name] || menu));
        };
        messageInput.addEventListener("input", liveUpdate);
        typeSelect.addEventListener("change", liveUpdate);

        const buttonsTitle = document.createElement("div");
        buttonsTitle.className = "buttons-title";
        buttonsTitle.textContent = this._t("buttons");
        card.appendChild(buttonsTitle);

        for (let rowIndex = 0; rowIndex < (menu?.rows || []).length; rowIndex++) {
          const row = menu.rows[rowIndex];
          const rowElement = document.createElement("div");
          rowElement.className = "button-row";

          for (let buttonIndex = 0; buttonIndex < row.length; buttonIndex++) {
            const button = row[buttonIndex];
            const editor = document.createElement("div");
            editor.className = "button-editor";

            const commandField = document.createElement("div");
            commandField.className = "field";
            commandField.innerHTML = "<label>" + this._t("command") + "</label>";

            const commandInput = document.createElement("input");
            commandInput.className = "command-input";
            commandInput.value = button?.command || "";
            commandInput.placeholder = "/licht_an";
            commandField.appendChild(commandInput);

            const actionTitle = document.createElement("div");
            actionTitle.className = "action-title";
            actionTitle.textContent = this._t("action");

            const actionHelp = document.createElement("div");
            actionHelp.className = "action-help";
            actionHelp.textContent = this._t("actionHelp");

            const actionField = document.createElement("div");
            actionField.className = "field";

            const actionLabel = document.createElement("label");
            actionLabel.textContent = this._t("service");

            const actionInput = document.createElement("input");
            actionInput.className = "action-input";
            actionInput.placeholder = "z. B. light.turn_on";
            actionInput.value = button?.actions?.[0]?.action || "";

            const actionSelect=document.createElement("select"); actionSelect.className="action-select"; actionSelect.innerHTML="<option value=\"\">"+this._t("chooseService")+"</option>"; const currentAction=actionInput.value; for(const service of this._getServices()){const o=document.createElement("option");o.value=service.value;o.textContent=service.label;actionSelect.appendChild(o);} if(currentAction && ![...actionSelect.options].some(o=>o.value===currentAction)){const o=document.createElement("option");o.value=currentAction;o.textContent=this._format("actionStored",{action:currentAction});actionSelect.appendChild(o);} actionSelect.value=currentAction; actionSelect.addEventListener("change",()=>actionInput.value=actionSelect.value); actionInput.style.marginTop="6px"; actionField.append(actionLabel,actionSelect,actionInput);

            actionSelect.addEventListener("change", liveUpdate);
            actionInput.addEventListener("input", liveUpdate);

            const targetField = document.createElement("div");
            targetField.className = "field";

            const targetLabel = document.createElement("label");
            targetLabel.textContent = this._t("target");

            const targetPicker = this._createEntityPicker(
              button?.actions?.[0]?.target?.entity_id?.[0] || "",
            );

            targetField.append(targetLabel, targetPicker);
            commandInput.addEventListener("input", liveUpdate);
            targetPicker.addEventListener("value-changed", liveUpdate);
            targetPicker.addEventListener("input", liveUpdate);

            const actions = document.createElement("div");
            actions.className = "button-actions";

            const removeButton = document.createElement("button");
            removeButton.className = "danger";
            removeButton.textContent = this._t("deleteButton");
            removeButton.addEventListener(
              "click",
              () => this._deleteButton(name, rowIndex, buttonIndex),
            );

            actions.appendChild(removeButton);
            editor.append(
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
        addButton.textContent = this._t("createButton");
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
