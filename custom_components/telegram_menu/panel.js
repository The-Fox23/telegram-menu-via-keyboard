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


  _setLanguage(language) {
    const normalized = String(language || "").toLowerCase().trim();
    const aliases = {
      de: "de",
      deutsch: "de",
      german: "de",
      en: "en",
      english: "en",
      fr: "fr",
      french: "fr",
      français: "fr",
      francais: "fr",
    };
    this._language = aliases[normalized] || "en";
  }

  _localize() {
    if (this._language === "de") return;
    const map = {
      en: {
        "Telegram Menu": "Telegram Menu",
        "Menüs und Buttons grafisch bearbeiten – jeder Button verwendet ausschließlich den Telegram-Command.": "Edit menus and buttons graphically – each button uses only the Telegram command.",
        "+ Menü erstellen": "+ Create menu", "Konfiguration wird geladen …": "Loading configuration …", "Änderungen gespeichert.": "Changes saved.",
        "Noch kein Telegram-Menü vorhanden": "No Telegram menu yet", "Erstelle zuerst ein Menü. Danach kannst du darin beliebig viele Telegram-Buttons anlegen.": "Create a menu first. You can then add as many Telegram buttons as you like.",
        "+ Erstes Menü erstellen": "+ Create first menu", "Umbenennen": "Rename", "▶ Tastatur starten": "▶ Start keyboard", "Löschen": "Delete",
        "Hier kannst du die Menü-Nachricht, den Tastaturtyp und die Telegram-Buttons konfigurieren.": "Configure the menu message, keyboard type and Telegram buttons here.",
        "Nachricht über der Tastatur": "Message above keyboard", "Tastaturtyp": "Keyboard type", "Normale Telegram-Tastatur": "Normal Telegram keyboard", "Inline-Tastatur": "Inline keyboard",
        "Telegram-Befehl": "Telegram command", "Aktionstyp": "Action type", "Home-Assistant-Aktion": "Home Assistant action", "Untermenü öffnen": "Open submenu", "Menü auswählen …": "Select menu …", "Optional: einen Home-Assistant-Dienst direkt mit diesem Button ausführen.": "Optional: execute a Home Assistant service directly with this button.",
        "Dienst / Aktion": "Service / action", "Dienst/Aktion auswählen …": "Select service/action …", "Ziel-Entity": "Target entity", "Untermenü konfigurieren": "Configure submenu", "Button löschen": "Delete button", "+ Button erstellen": "+ Create button",
        "Live-Vorschau": "Live preview", "Die Buttons zeigen und senden ausschließlich den konfigurierten Telegram-Command.": "Buttons display and send only the configured Telegram command.",
        "Buttons erscheinen hier als Vorschau.": "Buttons will appear here as a preview.", "Die Buttons sind anklickbar und führen die konfigurierte Home-Assistant-Aktion direkt aus.": "Buttons are clickable and directly execute the configured Home Assistant action.",
        "Speichern": "Save", "Speichern …": "Saving …", "Bitte auswählen:": "Please select:", "Nachricht schreiben …": "Type a message …", "Entity suchen …": "Search entity …", "Nach Anzeigename oder Entity-ID suchen.": "Search by display name or entity ID.", " (gespeichert)": " (saved)"
      },
      fr: {
        "Telegram Menu": "Menu Telegram",
        "Menüs und Buttons grafisch bearbeiten – jeder Button verwendet ausschließlich den Telegram-Command.": "Modifiez les menus et les boutons graphiquement – chaque bouton utilise uniquement la commande Telegram.",
        "+ Menü erstellen": "+ Créer un menu", "Konfiguration wird geladen …": "Chargement de la configuration …", "Änderungen gespeichert.": "Modifications enregistrées.",
        "Noch kein Telegram-Menü vorhanden": "Aucun menu Telegram", "Erstelle zuerst ein Menü. Danach kannst du darin beliebig viele Telegram-Buttons anlegen.": "Créez d'abord un menu. Vous pourrez ensuite ajouter autant de boutons Telegram que nécessaire.",
        "+ Erstes Menü erstellen": "+ Créer le premier menu", "Umbenennen": "Renommer", "▶ Tastatur starten": "▶ Démarrer le clavier", "Löschen": "Supprimer",
        "Hier kannst du die Menü-Nachricht, den Tastaturtyp und die Telegram-Buttons konfigurieren.": "Configurez ici le message du menu, le type de clavier et les boutons Telegram.",
        "Nachricht über der Tastatur": "Message au-dessus du clavier", "Tastaturtyp": "Type de clavier", "Normale Telegram-Tastatur": "Clavier Telegram normal", "Inline-Tastatur": "Clavier inline",
        "Telegram-Befehl": "Commande Telegram", "Aktionstyp": "Type d'action", "Home-Assistant-Aktion": "Action Home Assistant", "Untermenü öffnen": "Ouvrir un sous-menu", "Menü auswählen …": "Sélectionner un menu …", "Optional: einen Home-Assistant-Dienst direkt mit diesem Button ausführen.": "Facultatif : exécuter directement un service Home Assistant avec ce bouton.",
        "Dienst / Aktion": "Service / action", "Dienst/Aktion auswählen …": "Sélectionner un service / une action …", "Ziel-Entity": "Entité cible", "Button löschen": "Supprimer le bouton", "+ Button erstellen": "+ Créer un bouton",
        "Live-Vorschau": "Aperçu en direct", "Die Buttons zeigen und senden ausschließlich den konfigurierten Telegram-Command.": "Les boutons affichent et envoient uniquement la commande Telegram configurée.",
        "Buttons erscheinen hier als Vorschau.": "Les boutons apparaîtront ici en aperçu.", "Die Buttons sind anklickbar und führen die konfigurierte Home-Assistant-Aktion direkt aus.": "Les boutons sont cliquables et exécutent directement l'action Home Assistant configurée.",
        "Speichern": "Enregistrer", "Speichern …": "Enregistrement …", "Bitte auswählen:": "Veuillez sélectionner :", "Nachricht schreiben …": "Écrire un message …", "Entity suchen …": "Rechercher une entité …", "Nach Anzeigename oder Entity-ID suchen.": "Rechercher par nom d'affichage ou ID d'entité.", " (gespeichert)": " (enregistré)"
      }
    }[this._language] || {};
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const value = node.nodeValue.trim();
        if (map[value]) node.nodeValue = node.nodeValue.replace(value, map[value]);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.placeholder && map[node.placeholder]) node.placeholder = map[node.placeholder];
      if (node.title && map[node.title]) node.title = map[node.title];
      if (node.label && map[node.label]) node.label = map[node.label];
      for (const child of node.childNodes) walk(child);
    };
    walk(this);
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
      this._setLanguage(response?.language || this._panelConfig?.language);
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
    const saveButtons = this.querySelectorAll(".save-button");
    saveButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = "Speichern …";
    });

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
          let command = button.querySelector(".command-input")?.value.trim() || "";
          const actionType = button.querySelector(".button-action-type")?.value || "ha_action";
          const action = button.querySelector(".action-input")?.value.trim() || "";
          const target = button.querySelector(".target-input")?.value.trim() || "";
          const openMenu = button.querySelector(".menu-input")?.value.trim() || "";

          if (command && !command.startsWith("/")) {
            command = "/" + command;
          }

          const buttonConfig = { command };
          if (actionType === "menu" && openMenu) {
            buttonConfig.open_menu = openMenu;
          } else if (action) {
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
      command: "/neuer_button",
    });

    this._config = { ...this._config, menus };
    this._saved = false;
    this._render();
  }

  _focusMenu(menuName) {
    const card = [...this.querySelectorAll(".menu-card")]
      .find((element) => element.dataset.name === menuName);
    if (!card) return;

    card.scrollIntoView({ behavior: "smooth", block: "start" });
    card.classList.remove("submenu-target-highlight");
    requestAnimationFrame(() => {
      card.classList.add("submenu-target-highlight");
      window.setTimeout(() => card.classList.remove("submenu-target-highlight"), 1200);
    });

    card.querySelector(".message-input, .command-input")?.focus();
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
    input.placeholder = "Entity suchen …";
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

  async _previewButton(button) {
    const submenu = String(button?.open_menu || "").trim();
    if (submenu) {
      try {
        await this._hass.callService("telegram_menu", "show", { menu: submenu });
        this._error = "";
        this._render();
      } catch (e) {
        this._error = e?.message || "Untermenü konnte nicht geöffnet werden.";
        this._render();
      }
      return;
    }
    const a = button?.actions?.[0];
    if (!a?.action) {
      this._error = "Für diesen Button ist keine Aktion konfiguriert.";
      this._render();
      return;
    }
    try {
      const [d, s] = String(a.action).split(".", 2);
      await this._hass.callService(d, s, a.data || {}, a.target || {});
      this._error = "";
      this._render();
    } catch (e) {
      this._error = e?.message || "Aktion konnte nicht ausgeführt werden.";
      this._render();
    }
  }

  _renderPreview(menu) {
    const wrap = document.createElement("div");
    const phone = document.createElement("div");
    phone.className = "preview-phone";

    const top = document.createElement("div");
    top.className = "preview-top";

    const screen = document.createElement("div");
    screen.className = "preview-screen";

    const msg = document.createElement("div");
    msg.className = "preview-message";
    msg.textContent = menu?.message || "Bitte auswählen:";
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
        previewButton.title = button?.command || "Aktion testen";
        previewButton.addEventListener("click", () => this._previewButton(button));
        rowElement.appendChild(previewButton);
      }

      kb.appendChild(rowElement);
    }

    if (!(menu?.rows || []).length) {
      const empty = document.createElement("div");
      empty.className = "preview-empty";
      empty.textContent = "Buttons erscheinen hier als Vorschau.";
      kb.appendChild(empty);
    }

    screen.appendChild(kb);
    phone.append(top, screen);
    wrap.appendChild(phone);

    const hint = document.createElement("div");
    hint.className = "preview-hint";
    hint.textContent = "Die Buttons sind anklickbar und führen die konfigurierte Home-Assistant-Aktion direkt aus.";
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
          --telegram-blue: #229ED9;
          --telegram-blue-dark: #168AC0;
          --telegram-blue-deep: #0D7DB5;
          display: block;
          box-sizing: border-box;
          padding: 24px;
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 8%, rgba(255,255,255,.13) 0 2px, transparent 3px),
            radial-gradient(circle at 92% 16%, rgba(255,255,255,.10) 0 2px, transparent 3px),
            linear-gradient(135deg, var(--telegram-blue-deep) 0%, var(--telegram-blue) 48%, var(--telegram-blue-dark) 100%);
          background-size: 92px 92px, 118px 118px, 100% 100%;
          background-attachment: fixed;
          color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, sans-serif);
        }

        .container {
          max-width: 1500px;
          margin: 0 auto;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          color: white;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,.96);
          color: var(--telegram-blue);
          font-size: 27px;
          font-weight: 900;
          transform: rotate(-10deg);
          box-shadow: 0 7px 18px rgba(0,0,0,.20);
        }

        .brand-header h1 {
          color: white;
          margin: 0 0 3px;
        }

        .brand-header .subtitle {
          color: rgba(255,255,255,.90);
          margin: 0;
        }

        .editor-layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(300px,.75fr); gap:22px; align-items:start; }
        .preview-column { position:sticky; top:20px; }
        .preview-card { background:var(--card-background-color); border:2px solid rgba(255,255,255,.32); border-radius:18px; padding:18px; box-shadow:0 14px 35px rgba(0,0,0,.20); }
        .preview-title { font-size:19px; font-weight:700; margin-bottom:5px; }
        .preview-subtitle { font-size:12px; line-height:1.45; color:var(--secondary-text-color); margin-bottom:16px; }
        .preview-phone {
          width: min(100%, 350px);
          height: 650px;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 7px;
          border: 2px solid #26333d;
          border-radius: 38px;
          background: #101820;
          box-shadow: 0 0 0 2px rgba(255,255,255,.32), 0 18px 42px rgba(0,0,0,.38);
          position: relative;
        }

        .preview-phone::before {
          content:"";
          display:block;
          position:absolute;
          top:7px;
          left:50%;
          transform:translateX(-50%);
          width:104px;
          height:22px;
          background:#101820;
          border-radius:0 0 15px 15px;
          z-index:4;
        }

        .preview-phone::after {
          content:"";
          position:absolute;
          top:17px;
          right:11px;
          width:4px;
          height:4px;
          border-radius:50%;
          background:#3e4b54;
          z-index:5;
        }

        .preview-top {
          display:none;
        }

        .preview-top-left,
        .preview-avatar,
        .preview-top-title,
        .preview-top-menu {
          display:none;
        }

        .preview-screen {
          height:100%;
          padding:34px 13px 22px;
          background:
            radial-gradient(circle at 15px 15px, rgba(255,255,255,.13) 0 2px, transparent 3px),
            radial-gradient(circle at 55px 55px, rgba(255,255,255,.10) 0 2px, transparent 3px),
            linear-gradient(160deg, #229ED9 0%, #168AC0 100%);
          background-size:70px 70px, 85px 85px, auto;
          box-sizing:border-box;
          border-radius:30px;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .preview-message {
          display:none;
        }

        .preview-keyboard {
          width:100%;
          margin:0;
        }

        .preview-row { display:flex; gap:9px; margin-bottom:9px; }

        .preview-button {
          flex:1;
          min-width:0;
          min-height:64px;
          padding:12px 8px;
          border-radius:10px;
          background:rgba(7,77,130,.78);
          color:white;
          border:1px solid rgba(255,255,255,.12);
          font-size:13px;
          font-weight:650;
          cursor:pointer;
          box-shadow:0 2px 5px rgba(0,0,0,.14);
          transition:transform .16s ease, background-color .16s ease, box-shadow .16s ease, color .16s ease;
        }

        .preview-button:hover {
          background:rgba(34,158,217,.95);
          color:white;
          transform:translateY(-1px);
          box-shadow:0 4px 9px rgba(0,0,0,.20);
        }

        .preview-button:active {
          transform:translateY(1px);
          box-shadow:0 1px 2px rgba(0,0,0,.16);
        }

        .preview-empty {
          padding:14px;
          border:1px dashed rgba(34,158,217,.55);
          border-radius:10px;
          text-align:center;
          color:var(--secondary-text-color);
          font-size:12px;
        }

        .preview-composer,
        .preview-composer-input,
        .preview-send {
          display:none;
        }

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
          border-radius: 9px;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          background: #229ED9;
          color: white;
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease,
            transform 140ms ease,
            filter 180ms ease;
        }

        button:hover:not(:disabled) {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        button.secondary {
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
          border: 1px solid rgba(34,158,217,.45);
        }

        button.danger {
          background: var(--error-color);
          color: white;
          border: 2px solid rgba(255,255,255,.72);
          box-shadow: 0 2px 7px rgba(0,0,0,.16);
        }

        button.danger:hover:not(:disabled) {
          border-color: white;
          box-shadow: 0 4px 11px rgba(0,0,0,.22);
        }

        button:disabled {
          opacity: .6;
          cursor: default;
        }

        .status {
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--card-background-color);
          color: var(--secondary-text-color);
          border: 1px solid var(--divider-color);
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
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .menu-card:hover {
          border-color: color-mix(
            in srgb,
            var(--primary-color) 62%,
            var(--divider-color)
          );
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
        }

        .menu-card.submenu-target-highlight {
          animation: submenuTargetHighlight 1200ms ease;
        }

        @keyframes submenuTargetHighlight {
          0%, 100% {
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
          }
          35% {
            box-shadow: 0 0 0 4px rgba(34,158,217,.58), 0 10px 28px rgba(0,0,0,.24);
          }
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

        .header-save { font-weight:700; border-color:var(--primary-color)!important; }
        .buttons-editor-section {
          margin-top:20px; padding:14px; border-radius:14px;
          background:linear-gradient(135deg,var(--telegram-blue-deep),var(--telegram-blue-dark));
          border:2px solid rgba(255,255,255,.28); box-shadow:0 8px 22px rgba(0,0,0,.18);
        }
        .buttons-editor-section .buttons-title { margin-top:0; background:rgba(255,255,255,.12); color:white; border-left-color:white; }
        .buttons-editor-section .button-row { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.30); }
        .buttons-editor-section > .secondary { color:white; background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.40); }
        .button-action-type { width:100%; }
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
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease;
        }

        input:hover,
        select:hover {
          border-color: color-mix(
            in srgb,
            var(--primary-color) 45%,
            var(--divider-color)
          );
        }

        input:focus,
        select:focus {
          outline: 2px solid color-mix(
            in srgb,
            var(--primary-color) 32%,
            transparent
          );
          outline-offset: 1px;
          border-color: var(--primary-color);
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

        .button-editor {
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .button-editor:hover {
          border-color: color-mix(in srgb, var(--secondary-color, var(--primary-color)) 58%, var(--divider-color));
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.18);
          transform: translateY(-1px);
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
        
        .save-footer { display:none; }
        .save-footer button {
          min-width: 180px;
          min-height: 44px;
          padding: 10px 22px;
          font-size: 15px;
          font-weight: 700;
          background: var(--secondary-background-color) !important;
          color: var(--primary-text-color) !important;
          border: 2px solid var(--primary-color) !important;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: var(--ha-box-shadow);
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease,
            transform 140ms ease;
        }
        .save-footer button:hover:not(:disabled) {
          background: color-mix(
            in srgb,
            var(--primary-color) 12%,
            var(--secondary-background-color)
          ) !important;
          color: var(--primary-text-color) !important;
          border-color: var(--primary-color) !important;
          transform: translateY(-1px);
        }
        .save-footer button:active:not(:disabled) {
          transform: translateY(0);
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

        @media (max-width: 900px) {
          .editor-layout{grid-template-columns:1fr;}
          .preview-column{position:static;}
          .preview-phone{height:610px;}
        }

        @media (max-width: 600px) {
          :host {
            padding: 12px;
          }

          .brand-header {
            gap: 10px;
          }

          .brand-icon {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
            font-size: 23px;
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
        <div class="brand-header">
          <div class="brand-icon">➤</div>
          <div>
            <h1>Telegram Menu</h1>
            <div class="subtitle">Menüs und Buttons grafisch bearbeiten – jeder Button verwendet ausschließlich den Telegram-Command.</div>
          </div>
        </div>

        <div class="toolbar">
          <button id="add-menu">+ Menü erstellen</button>
        </div>

        ${this._loading ? '<div class="status">Konfiguration wird geladen …</div>' : ""}
        ${this._error ? `<div class="status error">${this._escape(this._error)}</div>` : ""}
        ${this._saved ? '<div class="status success">Änderungen gespeichert.</div>' : ""}

        <div class="editor-layout">
          <div id="content"></div>
          <div class="preview-column">
            <div class="preview-card">
              <div class="preview-title">Live-Vorschau</div>
              <div class="preview-subtitle">Die Buttons zeigen und senden ausschließlich den konfigurierten Telegram-Command.</div>
              <div id="preview"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const content = this.querySelector("#content");
    const previewHost = this.querySelector("#preview");

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

        const save = document.createElement("button");
        save.className = "secondary header-save save-button";
        save.textContent = "Speichern";
        save.addEventListener("click", () => this._saveConfig());
        header.append(title, start, save, rename, remove);
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

        const buttonsSection = document.createElement("div");
        buttonsSection.className = "buttons-editor-section";
        const buttonsTitle = document.createElement("div");
        buttonsTitle.className = "buttons-title";
        buttonsTitle.textContent = "Buttons";
        buttonsSection.appendChild(buttonsTitle);

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
            commandField.innerHTML = "<label>Telegram-Befehl</label>";

            const commandInput = document.createElement("input");
            commandInput.className = "command-input";
            commandInput.value = button?.command || "";
            commandInput.placeholder = "/licht_an";
            commandField.appendChild(commandInput);

            const actionTitle = document.createElement("div");
            actionTitle.className = "action-title";
            actionTitle.textContent = "Aktionstyp";

            const actionTypeField = document.createElement("div");
            actionTypeField.className = "field";
            const actionType = document.createElement("select");
            actionType.className = "button-action-type";
            actionType.innerHTML = '<option value="ha_action">Home-Assistant-Aktion</option><option value="menu">Untermenü öffnen</option>';

            const storedMenu = String(button?.open_menu || "").trim();
            const storedAction = button?.actions?.[0]?.action || "";
            actionType.value = storedMenu ? "menu" : "ha_action";

            const actionHelp = document.createElement("div");
            actionHelp.className = "action-help";

            const actionField = document.createElement("div");
            actionField.className = "field";
            const actionLabel = document.createElement("label");
            actionLabel.textContent = "Dienst / Aktion";
            const actionInput = document.createElement("input");
            actionInput.className = "action-input";
            actionInput.placeholder = "z. B. light.turn_on";
            actionInput.value = storedAction;

            const actionSelect = document.createElement("select");
            actionSelect.className = "action-select";
            actionSelect.innerHTML = '<option value="">Dienst/Aktion auswählen …</option>';
            for (const service of this._getServices()) {
              const option = document.createElement("option");
              option.value = service.value;
              option.textContent = service.label;
              actionSelect.appendChild(option);
            }
            if (storedAction && ![...actionSelect.options].some((o) => o.value === storedAction)) {
              const option = document.createElement("option");
              option.value = storedAction;
              option.textContent = storedAction + " (gespeichert)";
              actionSelect.appendChild(option);
            }
            actionSelect.value = storedAction;
            actionSelect.addEventListener("change", () => {
              actionInput.value = actionSelect.value;
              liveUpdate();
            });
            actionInput.style.marginTop = "6px";
            actionField.append(actionLabel, actionSelect, actionInput);

            const targetField = document.createElement("div");
            targetField.className = "field";
            const targetLabel = document.createElement("label");
            targetLabel.textContent = "Ziel-Entity";
            const targetPicker = this._createEntityPicker(button?.actions?.[0]?.target?.entity_id?.[0] || "");
            targetField.append(targetLabel, targetPicker);

            const menuField = document.createElement("div");
            menuField.className = "field";
            const menuLabel = document.createElement("label");
            menuLabel.textContent = "Menü auswählen …";
            const menuSelect = document.createElement("select");
            menuSelect.className = "menu-input";
            menuSelect.innerHTML = '<option value="">Menü auswählen …</option>';
            const otherMenus = menuEntries.filter(([menuName]) => menuName !== name);
            for (const [menuName] of otherMenus) {
              const option = document.createElement("option");
              option.value = menuName;
              option.textContent = menuName;
              menuSelect.appendChild(option);
            }
            if (storedMenu && !otherMenus.some(([menuName]) => menuName === storedMenu)) {
              const option = document.createElement("option");
              option.value = storedMenu;
              option.textContent = storedMenu + " (gespeichert)";
              menuSelect.appendChild(option);
            }
            menuSelect.value = storedMenu;

            const configureMenuButton = document.createElement("button");
            configureMenuButton.type = "button";
            configureMenuButton.className = "secondary submenu-configure";
            configureMenuButton.textContent = "Untermenü konfigurieren";
            configureMenuButton.addEventListener("click", () => {
              const targetMenu = menuSelect.value.trim();
              if (targetMenu) this._focusMenu(targetMenu);
            });

            actionTypeField.appendChild(actionType);
            menuField.append(menuLabel, menuSelect, configureMenuButton);

            const refreshActionMode = () => {
              const menuMode = actionType.value === "menu";
              actionHelp.textContent = menuMode
                ? "Beim Telegram-Befehl wird das ausgewählte Untermenü geöffnet. Dort kannst du weitere Untermenüs oder die endgültige Home-Assistant-Aktion konfigurieren."
                : "Optional: einen Home-Assistant-Dienst direkt mit diesem Button ausführen.";
              actionField.hidden = menuMode;
              targetField.hidden = menuMode;
              menuField.hidden = !menuMode;
              configureMenuButton.hidden = !menuMode || !menuSelect.value.trim();
              liveUpdate();
            };
            actionType.addEventListener("change", refreshActionMode);
            actionInput.addEventListener("input", liveUpdate);
            targetPicker.addEventListener("value-changed", liveUpdate);
            targetPicker.addEventListener("input", liveUpdate);
            menuSelect.addEventListener("change", () => {
              configureMenuButton.hidden = actionType.value !== "menu" || !menuSelect.value.trim();
              liveUpdate();
            });
            refreshActionMode();

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
              commandField,
              actionTitle,
              actionHelp,
              actionTypeField,
              actionHelp,
              actionField,
              targetField,
              menuField,
              actions,
            );
            rowElement.appendChild(editor);
          }

          buttonsSection.appendChild(rowElement);
        }

        const addButton = document.createElement("button");
        addButton.className = "secondary";
        addButton.textContent = "+ Button erstellen";
        addButton.addEventListener("click", () => this._addButton(name));
        buttonsSection.appendChild(addButton);
        card.appendChild(buttonsSection);

        content.appendChild(card);
      }
    }

    this.querySelector("#add-menu")?.addEventListener(
      "click",
      () => this._createMenu(),
    );

    this._localize();
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
