# Telegram Menu via Keyboard – Projektstatus

> Zentrale Projektdokumentation für die Weiterentwicklung der Home-Assistant-Integration **Telegram Menu via Keyboard**. Diese Datei wird bei größeren Entwicklungsschritten aktualisiert.

## 1. Repository
- GitHub Repository: `The-Fox23/telegram-menu-via-keybord`
- Geplanter Zielname: `telegram-menu-via-keyboard`
- Integration Domain: `telegram_menu`
- Anzeigename: **Telegram Menu via Keyboard**
- Aktuelle Version: 0.0.23
- Home Assistant Mindestversion laut `hacs.json`: **2026.1.0**
- Abhängigkeiten: `telegram_bot`, `websocket_api`, `http`, `frontend`
- Integrationstyp: `service`
- IoT-Klasse: `local_push`
- `single_config_entry: true`

## 2. Projektziel
Die Integration soll Telegram in Home Assistant um eine komfortable grafische Menü- und Steuerungsoberfläche erweitern.

Langfristig soll für normale Telegram-Buttons **keine separate Home-Assistant-Automation** mehr nötig sein. Stattdessen sollen Menüs, Buttons und deren Aktionen direkt in der Integration konfiguriert werden.

## 3. Architektur
### Aktuell
Telegram → Button/Command → Telegram Event → eigene Automation → Aktion

### Ziel
Telegram → Button/Command → Telegram Menu Integration → gespeicherte Button-Aktionen → Home Assistant

## 4. Aktueller Funktionsstand
Die bestehende Integration kann:
- Telegram Notify Entity verwenden
- Standard-Chat-ID speichern
- Reply Keyboards anzeigen
- Inline Keyboards anzeigen
- `telegram_menu.show` verwenden
- `telegram_menu.hide` verwenden
- Buttons in Reihen konfigurieren
- Button-Labels und Telegram-Commands speichern
- bestehende Telegram-Command-Automationen unterstützen
- ein eigenes Home-Assistant-Sidebar-Panel bereitstellen
- das Sidebar-Icon **`mdi:keyboard`** anzeigen
- bestehende Menüs und Buttons grafisch laden
- Menüs grafisch erstellen, umbenennen und löschen
- Menü-Nachricht und Tastaturtyp grafisch ändern
- Buttons grafisch erstellen, bearbeiten und löschen
- Änderungen über die Home-Assistant-WebSocket-API speichern
- Button-Editor optisch überarbeitet: farbige/abgesetzte Button-Kästen mit Rahmen, abgerundeten Ecken, Abstand und dezenter Schattenwirkung
- eine Live-Vorschau der Telegram-Tastatur direkt im Sidebar-Panel anzeigen
- Vorschau-Buttons direkt aus dem Panel testen und die konfigurierte Home-Assistant-Aktion ausführen
- verfügbare Home-Assistant-Dienste in einem Dropdown auswählen
- eine native Home-Assistant-Entity-Auswahl verwenden, sofern der HA-Frontend-Selector geladen ist
- bei noch nicht geladenem Selector auf eine komfortable durchsuchbare Entity-Auswahl mit Anzeigenamen und Entity-ID zurückfallen
- die Integrationsversion im Panel anzeigen

## 5. Grafischer Editor
Das Panel bietet jetzt ausdrücklich:
- **+ Menü erstellen**
- **+ Erstes Menü erstellen**, wenn noch kein Menü vorhanden ist
- **+ Button erstellen** innerhalb eines Menüs
- Anzeigename des Buttons
- Telegram-Befehl
- Button löschen
- Menü-Nachricht
- Tastaturtyp
- Menü umbenennen/löschen
- **Dienst / Aktion** als Dropdown mit den aktuell verfügbaren Home-Assistant-Diensten
- freie Eingabe einer gespeicherten/benutzerdefinierten Aktion
- komfortable **Ziel-Entity-Auswahl**
- **Live-Vorschau** der Telegram-Nachricht und Tastatur auf der rechten Seite
- Vorschau-Button zum direkten Testen der konfigurierten Aktion
- **Speichern** am unteren Ende

Die native Entity-Auswahl orientiert sich an Home Assistants aktuellem `ha-selector`-/Entity-Selector-Prinzip. Home Assistant verwendet den Entity-Selector auch in seinen eigenen grafischen Editoren. citeturn0search0turn0search2

## 6. Wichtige technische Dateien
Unter `custom_components/telegram_menu/`:
- `__init__.py`: Setup, Services, WebSocket-API und Config Entry
- `config_flow.py`: bisheriger klassischer Config Flow
- `menu.py`: Telegram-Menüausgabe
- `const.py`: Konstanten
- `panel.py`: Sidebar-Panel
- `panel.js`: grafischer Menü-/Button-Editor
- `PROJECT_STATUS.md`: Projektstatus

Der klassische Config Flow bleibt zunächst erhalten.

## 7. Entwicklungsplan
### Schritt 1 – Grafisches Home-Assistant-Panel
**Status: IMPLEMENTIERT**

Das Panel wird als eingebautes Custom-Panel registriert. Die Panel-JavaScript-Datei wird statisch ausgeliefert und mit der Integrationsversion über die Panel-Konfiguration versioniert.

### Schritt 2 – Menü-Editor
**Status: IMPLEMENTIERT**

Menüs können erstellt, umbenannt, gelöscht und mit Nachricht sowie Tastaturtyp konfiguriert werden.

### Schritt 3 – Button-Editor
**Status: IMPLEMENTIERT**

Buttons können erstellt, bearbeitet und gelöscht werden. Anzeigename, Telegram-Command und Position/Reihe werden grafisch konfiguriert. Die Darstellung verwendet klar abgesetzte Bereiche.

### Schritt 4 – Aktionen direkt am Button
**Status: IMPLEMENTIERT / ERSTE AUSBAUSTUFE**

Jeder Button kann eine optionale Home-Assistant-Aktion erhalten. Der Dienst kann über ein Dropdown ausgewählt oder als freier Wert eingegeben werden. Zusätzlich kann eine Ziel-Entity ausgewählt werden.

### Schritt 5 – Aktionen ohne zusätzliche Automation
**Status: IMPLEMENTIERT / GETESTET**

Telegram-Befehl → Button suchen → gespeicherte Aktion ausführen.

Die erste Ausbaustufe führt bei einem passenden Telegram-Befehl die erste konfigurierte Aktion des Buttons aus. Der Benutzer hat erfolgreich getestet, dass damit ein Licht eingeschaltet werden konnte. Die Ausführung ist weiterhin auf die konfigurierte Standard-Chat-ID begrenzt.

### Schritt 6 – Mehrere Aktionen
**Status: GEPLANT**

Beispiel:
- Garage öffnen
- 1 Sekunde warten
- Licht einschalten
- Telegram-Nachricht senden

### Schritt 7 – Untermenüs
**Status: GEPLANT**

### Schritt 8 – Bedingungen
**Status: SPÄTER / OPTIONAL**

## 8. Aktueller Teststand v0.0.17
In v0.0.17 wurden die nächsten UI-Schritte umgesetzt:

1. **Live-Vorschau korrigiert und sichtbar eingebunden**
   - Vorschau erscheint rechts neben dem Editor auf breiten Bildschirmen.
   - Auf schmalen Bildschirmen wandert sie unter den Editor.
   - Telegram-Nachricht und Button-Reihen werden visuell dargestellt.
   - Ein Klick auf einen Vorschau-Button führt die konfigurierte erste Home-Assistant-Aktion direkt aus.

2. **Dienst/Aktion**
   - Dropdown enthält die aktuell von Home Assistant gemeldeten Dienste.
   - Eine gespeicherte Aktion, die nicht in der aktuellen Dienstliste vorhanden ist, bleibt auswählbar und wird als „gespeichert“ gekennzeichnet.

3. **Entity-Auswahl**
   - Der Editor verwendet bevorzugt den nativen Home-Assistant-`ha-selector` mit `entity`-Selector.
   - Da Home Assistant Teile des Frontends lazy lädt, wird versucht, den nativen Selector über bereits registrierte HA-Editor-Komponenten nachzuladen.
   - Falls der native Selector zu diesem Zeitpunkt nicht verfügbar ist, gibt es eine komfortable Suchauswahl als Fallback. Diese durchsucht Anzeigenamen und Entity-IDs und zeigt bis zu 25 Treffer an.

4. **Versionsanzeige**
   - Die Version wird über `panel.py` aus `version.py` bereitgestellt.
   - `version.py` liest die Version direkt aus `manifest.json`.
   - Für v0.0.17 ist damit die Anzeige im Panel auf die Integrationsversion gekoppelt.

## 9. Bekannte offene Punkte
- Mehrere Aktionen pro Button fehlen noch; aktuell ist die Ausführung auf die erste konfigurierte Aktion ausgelegt.
- Service-Datenfelder (z. B. Helligkeit, Farbe, Nachrichtentext) werden noch nicht vollständig grafisch bearbeitet.
- Bedingungen fehlen noch.
- Die native HA-Entity-Auswahl hängt vom Lazy-Loading-Zustand des Home-Assistant-Frontends ab; der Such-Fallback bleibt deshalb wichtig.
- Die Untermenü-Navigation wurde im Editor und in der Konfiguration ergänzt, muss aber noch vollständig im laufenden Home Assistant getestet werden.
- In der zuletzt im Chat geprüften `panel.js` fehlt die Methode `_renameMenu(oldName)`, obwohl der Umbenennen-Button sie aufruft. Diese Methode muss wieder ergänzt und danach getestet werden.

## 10. Release-Prinzip

Die Integrationsversion wird bei jedem veröffentlichten Entwicklungsstand erhöht. Für HACS ist die GitHub-Release/Tag-Version maßgeblich. Wenn das automatische Anlegen bzw. Verschieben von Releases über die verfügbaren GitHub-Schnittstellen nicht möglich ist, wird der Release-Tag manuell auf den aktuellen `main`-Stand angelegt.

Für diesen Stand ist die Integrationsversion **0.0.16** gesetzt. Der GitHub-Release/Tag kann anschließend manuell als **v0.0.17** auf `main` erstellt werden.

## 11. Entwicklungsprinzipien
- Funktionierende Telegram-Anbindung nicht unnötig verändern.
- Kleine, testbare Schritte.
- Nach größeren Änderungen `PROJECT_STATUS.md` aktualisieren.
- Keine persönlichen Telegram IDs, Tokens oder Zugangsdaten ins Repository.
- Bestehenden Config Flow zunächst erhalten.
- Home-Assistant-native UI nach Möglichkeit verwenden.

**Letzte Aktualisierung:** 2026-09-28

**Release:** v0.0.17

**Aktueller Fokus:** v0.0.17 testen: Live-Vorschau, Dienst-Dropdown, native/komfortable Entity-Auswahl und Versionsanzeige. Danach mehrere Aktionen pro Button erweitern.


### v0.0.17 Fehlerbehebung
- `panel.js`: Ungültige literale `\\n`-Sequenzen außerhalb des Template-Literals entfernt, die zu einem JavaScript-Syntaxfehler und damit zur schwarzen/leeren Panel-Seite führten.
- Keine Änderungen an der funktionierenden Telegram-Aktionslogik.
- v0.0.17 ist für den Test vor dem Release vorgesehen.


### Live-Vorschau v0.0.17
- Vorschau erhält einen deutlich sichtbaren Handy-Rahmen, auch im Dark Mode.
- Telegram-Buttons in der Vorschau sind echte anklickbare Buttons mit Hover-/Pressed-Effekt.
- Vorschau aktualisiert sich bei Änderungen an Nachricht, Tastaturtyp, Anzeigename, Telegram-Befehl, Dienst/Aktion und Ziel-Entity.
- Vorschau-Buttons führen weiterhin die konfigurierte Home-Assistant-Aktion direkt aus.


### v0.0.18 – Vereinfachter Einrichtungsassistent
- Config Flow fragt nur noch Telegram-Bot/Notify-Entity und Chat-ID ab.
- Menüname, Nachricht, Tastaturtyp und Buttons werden nicht mehr während der Integrationseinrichtung abgefragt.
- Nach der Einrichtung wird automatisch ein leeres `main`-Menü angelegt.
- Die weitere Konfiguration erfolgt vollständig im grafischen Telegram-Menu-Editor.


### v0.0.19 – Vorschau- und CSS-Korrektur
- Fehlerhafte literale \\n-Sequenzen im Panel-CSS entfernt.
- Handyrahmen der Live-Vorschau wird wieder korrekt dargestellt.
- Speichern-Button im hellen und dunklen Theme deutlich sichtbar gestaltet.


### v0.0.20 – Telegram-Button-Funktion korrigiert
- Inline-Tastatur wird jetzt im von Home Assistant erwarteten Format `Beschriftung:/command` übertragen.
- Telegram-Callbacks werden über `data` bzw. `command` verarbeitet.
- Reply-Keyboards werden zusätzlich über `telegram_text` verarbeitet.
- Button-Aktionen können über Telegram-Befehl, Button-Text oder Inline-Callback gefunden werden.
- Optionaler Bot-Namenszusatz bei Telegram-Kommandos wird berücksichtigt.


### v0.0.21 – Testmodus: reine Telegram-Commands
- Anzeigename/Label wurde aus dem Button-Editor entfernt.
- Jeder Button besteht jetzt nur noch aus einem Telegram-Command, z. B. `/licht_an`.
- Fehlt beim Eingeben der führende `/`, ergänzt die Oberfläche ihn automatisch.
- Reply-Keyboard sendet ausschließlich den Command als Button-Text.
- Inline-Keyboard verwendet ebenfalls Command als sichtbaren Text und als Callback-Daten.
- Die Command-Suche im Backend normalisiert fehlende führende `/` und optionale Bot-Namen.
- Ziel dieses Schrittes: zuerst die Telegram-Command-Auslösung und die direkte Home-Assistant-Aktion mit möglichst einfacher Button-Struktur testen.

**Letzte Aktualisierung:** 2026-09-29

**Release:** v0.0.21


### v0.0.22 – Telegram-Logik auf funktionierenden v0.0.17-Stand zurückgesetzt
- `__init__.py` und `menu.py` wurden vollständig auf die nachweislich funktionierende v0.0.17-Logik zurückgesetzt.
- Keine Änderungen an der bewährten `telegram_command`-Verarbeitung.
- Die aktuelle Oberfläche bleibt beim reinen Telegram-Command ohne Anzeigename.
- Ziel: Funktionalität von v0.0.17 wiederherstellen und UI-Änderung davon getrennt testen.

**Letzte Aktualisierung:** 2026-09-29

**Release:** v0.0.22


### v0.0.23 – Mehrsprachige Oberfläche
- Die Ersteinrichtung beginnt jetzt mit einer **englischen Sprachauswahl**.
- Verfügbare Sprachen: **Deutsch, English und Français**.
- Die gewählte Sprache wird in der Config Entry gespeichert.
- Die Sidebar-Bezeichnung wird entsprechend der gewählten Sprache angezeigt:
  - Deutsch: **Telegram Menü**
  - English: **Telegram Menu**
  - Français: **Menu Telegram**
- Das grafische Sidebar-Panel wurde für Deutsch, Englisch und Französisch lokalisiert.
- Über **Konfigurieren** kann die Sprache später geändert werden, ohne die Integration neu einzurichten.
- Bestehende Telegram-Tastatur-, Command- und Action-Logik aus v0.0.22 wurde nicht verändert.
- Config-Entry-Migration auf Version 4 ergänzt.
- Integrationsversion in `manifest.json` auf **0.0.23** erhöht.

**Letzte Aktualisierung:** 2026-09-29

**Release:** v0.0.23

**Aktueller Fokus:** v0.0.23 testen: neue Installation, englische Sprachauswahl, Sprachumschaltung und Sidebar-/Panel-Übersetzungen.


### v0.0.23 – Sicherheitskorrektur und Lokalisierung final vorbereitet
- Die stabile `panel.js`-Basis aus v0.0.22 wurde beibehalten; die Mehrsprachigkeit wurde anschließend gezielt ergänzt.
- Das Panel verwendet jetzt die in der Config Entry gespeicherte Sprache für die sichtbaren UI-Texte.
- Unterstützte Panel-Sprachen: Deutsch, English und Français.
- Die Sidebar-Titel werden über `panel.py` entsprechend der Auswahl gesetzt:
  - Deutsch: **Telegram Menü**
  - English: **Telegram Menu**
  - Français: **Menu Telegram**
- Die erste Sprachauswahl des Config Flows bleibt unabhängig von der Home-Assistant-Sprache **immer Englisch**.
- Die Sprache kann später über **Konfigurieren** geändert werden.
- Die funktionierende Telegram-Command-/Action-Logik aus v0.0.22 wurde nicht verändert.
- Nach einer fehlerhaften ersten UI-Lokalisierungsänderung wurde `panel.js` zunächst vollständig auf den stabilen Stand zurückgesetzt und danach kontrolliert erweitert.
- Panel-Datei geprüft: ausgeglichene Klammer-/Blockstruktur und keine fehlerhafte rekursive Übersetzung im Textdictionary.
- `manifest.json` steht auf **0.0.23**.
- **Kein GitHub Release/Tag wurde von mir angelegt.** Der Release/Tag **v0.0.23** kann jetzt manuell auf `main` erstellt werden.

**Letzte Aktualisierung:** 2026-09-29

**Status:** v0.0.23 für manuellen Release/Tag vorbereitet.


### v0.0.24 bis v0.0.28 – UI-Ausbau und Stabilisierung
- Der grafische Editor wurde weiter ausgebaut und die Button-Karten erhielten eine klar abgesetzte Darstellung mit Rahmen, Hintergrund und Schatten.
- Die bestehende Telegram-Command-/Action-Logik blieb unangetastet.
- Die Mehrsprachigkeit wurde weitergeführt; die UI verwendet die in der Config Entry gespeicherte Sprache Deutsch, English oder Français. Eine Sprachänderung innerhalb der UI ist bewusst nicht vorgesehen.
- Die Panel-Registrierung wurde stabilisiert: Der Status der registrierten statischen Panel-Route wird jetzt außerhalb von `hass.data[DOMAIN]` gespeichert. Damit wird verhindert, dass der Manager-Lookup durch ein zusätzliches Flag verfälscht wird.
- Ein JavaScript-Syntaxfehler in der Sprachinitialisierung wurde korrigiert, der zu einer leeren/nicht ladenden UI führen konnte.
- WebSocket-Registrierung und Config-Flow wurden geprüft und unverändert als funktionierende Basis beibehalten.
- v0.0.28 wurde als stabiler Zwischenstand veröffentlicht.

**Release:** v0.0.28

### v0.0.29 – Französische UI und Theme-Überarbeitung
- Die Sprachauflösung im Panel wurde robuster gemacht und akzeptiert jetzt neben den Sprachcodes auch Bezeichnungen wie `French`, `french`, `français` und `francais`.
- Die französische UI-Lokalisierung bleibt auf Basis des bestehenden Übersetzungsmodells erhalten.
- Der **Speichern**-Button wurde für den normalen/hellen Modus überarbeitet: Text und Hintergrund haben jetzt einen ausreichenden Kontrast und bleiben auch bei unterschiedlichen Home-Assistant-Themes lesbar.
- Buttons besitzen jetzt sanfte Hover-, Active- und Fokus-Übergänge.
- Eingabefelder und Auswahlfelder erhalten flüssige Hover-/Focus-Übergänge.
- Menü-Karten und Button-Karten reagieren mit dezenten Übergängen und Schatten auf Hover.
- Die Dark-Mode-Darstellung wurde dadurch optisch ruhiger und konsistenter gestaltet.
- Keine Änderungen an der funktionierenden Telegram-Command-/Action-Ausführung.
- `manifest.json` wurde auf **0.0.29** erhöht.

**Letzte Aktualisierung:** 2026-09-29

**Status:** v0.0.29 ist auf `main` vorbereitet und kann als GitHub-Tag/Release **v0.0.29** erstellt werden.

**Aktueller Fokus:** v0.0.29 in Home Assistant testen – Französisch, Speichern-Button im Light Mode sowie Übergänge und Hover-Effekte im Dark Mode.


### v0.0.30 – Telegram-Blue UI und Smartphone-Vorschau
- Die komplette Panel-Hintergrundfläche verwendet jetzt ein festes Telegram-Blau mit dezentem Hintergrundmuster – unabhängig davon, ob Home Assistant im Light- oder Dark-Mode läuft.
- Kopfbereich des Panels erhält eine Telegram-inspirierte Markenoptik mit blauem Farbschema und klarer weißer Typografie.
- Die bestehenden Editor-Karten bleiben im jeweiligen Home-Assistant-Theme lesbar und setzen sich deutlich vom blauen Seitenhintergrund ab.
- Die Live-Vorschau wurde zu einer deutlich realistischeren Smartphone-Darstellung ausgebaut.
- Das Smartphone zeigt einen Telegram-inspirierten Chat-Kopf, Nachricht, echte konfigurierte Button-Reihen und einen Nachrichtenbereich.
- Die vorhandene direkte Testfunktion der Vorschau-Buttons bleibt erhalten.
- Keine Änderungen an Telegram-Command-Verarbeitung, gespeicherten Menüstrukturen oder Home-Assistant-Aktionen.
- `manifest.json` wurde auf **0.0.30** erhöht.

**Letzte Aktualisierung:** 2026-10-01

**Status:** v0.0.30 ist auf `main` vorbereitet. Kein GitHub-Tag/Release wurde angelegt.

**Aktueller Fokus:** v0.0.30 in Home Assistant testen – Light Mode, Dark Mode, Smartphone-Vorschau und bestehende Telegram-Button-Funktion.


### v0.0.31 – Smartphone-Vorschau als reine Telegram-Tastatur
- Die Smartphone-Vorschau wurde auf die gewünschte Darstellung reduziert.
- Im Handy werden jetzt ausschließlich die konfigurierten Telegram-Tasten angezeigt.
- Chat-Kopf, Nachricht und Eingabefeld wurden aus der Vorschau entfernt.
- Die Tasten werden weiterhin dynamisch aus dem aktuell ausgewählten Menü aufgebaut.
- Die Telegram-blaue Smartphone-Fläche und die bestehende blaue Gesamtoptik bleiben erhalten.
- `manifest.json` wurde auf **0.0.31** erhöht.

**Status:** v0.0.31 ist auf `main` vorbereitet. Kein GitHub-Tag/Release wurde angelegt.


### v0.0.32 – Untermenüs und Editor-Layout
- Buttons können zwischen **Home-Assistant-Aktion** und **Untermenü öffnen** unterscheiden.
- Ein Button kann ein anderes konfiguriertes Menü als Ziel auswählen.
- Der Telegram-Command des Buttons öffnet beim Empfang direkt das ausgewählte Untermenü.
- Die bisherige Dienst-/Aktion- und Ziel-Entity-Auswahl bleibt für normale Aktions-Buttons erhalten.
- Die Live-Vorschau unterstützt auch Untermenü-Buttons.
- Der Button-Editor ist jetzt deutlich **Telegram-blau** hinterlegt.
- **Speichern** wurde aus dem unteren Seitenbereich entfernt und befindet sich jetzt oben im Menü-Header neben den Menüaktionen und direkt bei **Umbenennen**.
- Integrationsversion auf **0.0.32** erhöht.
- Kein GitHub-Tag/Release wurde angelegt.

**Letzte Aktualisierung:** 2026-10-02

**Status:** v0.0.32 auf `main` vorbereitet.


### v0.0.32 – Untermenü-Navigation im Editor erweitert
- Bei **Untermenü öffnen** werden **Dienst/Aktion** und **Ziel-Entity** ausgeblendet.
- Stattdessen wird die Auswahl des Zielmenüs angezeigt.
- Nach Auswahl eines Zielmenüs erscheint **Untermenü konfigurieren**.
- Der Button springt direkt zum ausgewählten Menü und hebt dieses kurz hervor.
- Damit kann die Menüstruktur rekursiv aufgebaut werden: Menübutton → Untermenü → weiteres Untermenü → finaler Home-Assistant-Aktionsbutton.
- Löschen-Buttons besitzen jetzt einen sichtbaren Rahmen.


### 0.0.32 – Aktueller Entwicklungsstand: Untermenüs und Editor-Korrekturen
**Stand: 2026-10-09**

- Die aktuelle Entwicklungsbasis ist Version **0.0.32**. Es wird weiterhin lokal über Studio Code Server getestet.
- **Kein neuer GitHub-Tag/Release und keine Versionsanhebung** sind für diese Korrekturen vorgesehen.
- Der Editor unterstützt als Aktionstyp **Home-Assistant-Aktion** oder **Untermenü öffnen**.
- Bei Untermenü-Buttons werden die Felder für Dienst/Aktion und Ziel-Entity ausgeblendet; stattdessen wird das Zielmenü ausgewählt.
- **Untermenü konfigurieren** springt zum gewählten Menü, damit sich verschachtelte Menüstrukturen aufbauen lassen.
- Das Löschen eines Menüs wird verhindert, wenn andere Buttons noch auf dieses Menü verweisen. Die Meldung nennt die referenzierenden Menüs/Buttons.
- Die doppelte Einfügung von `actionHelp` wurde in der zuletzt geposteten `panel.js` entfernt.
- **Noch offen:** In der zuletzt geposteten vollständigen `panel.js` fehlt `_renameMenu(oldName)`, obwohl der Umbenennen-Button diese Methode aufruft. Vor dem nächsten Test muss sie ergänzt werden. Beim Umbenennen sollen bestehende Untermenü-Verweise auf den neuen Namen aktualisiert werden.
- Anschließend die JavaScript-Datei auf Syntaxfehler prüfen, nach `/config/custom_components/telegram_menu` kopieren und Home Assistant bzw. das Panel neu laden. Danach Umbenennen, Löschen eines referenzierten Untermenüs und verschachtelte Navigation testen.

**Letzte Aktualisierung:** 2026-10-09

**Status:** v0.0.32 bleibt unverändert; Korrekturen sind weiterhin im Test, kein Release/Tag erstellt.

**Nächster Schritt:** `_renameMenu(oldName)` in `panel.js` wieder ergänzen und anschließend die Editor-Funktionen testen.


### 0.0.32 – Automatische Zurück- und Hauptmenü-Navigation
**Stand: 2026-10-09**

- `menu.py`: Untermenüs erhalten automatisch die Tasten **⬅️ Zurück** und **🏠 Hauptmenü**. Das gilt für Reply- und Inline-Tastaturen.
- Die Navigation wird pro Telegram-Chat als Menüpfad gespeichert. **Zurück** geht eine Ebene nach oben; **Hauptmenü** setzt den Pfad auf `main` zurück.
- `__init__.py`: Telegram-Befehle und Inline-Callbacks werden auf die Navigationsbefehle geprüft. Reply-Keyboard-Texte werden über `telegram_text` abgefangen; nur die beiden reservierten Navigationstexte werden dort verarbeitet.
- `panel.js`: Löschen eines Menüs wird verhindert, wenn andere Menüs darauf verweisen. Beim Umbenennen werden bestehende Untermenü-Verweise aktualisiert.
- **Noch zu testen:** Event-Payloads von Reply-Keyboard und Inline-Callbacks auf der installierten Home-Assistant-/telegram_bot-Version prüfen; verschachtelte Navigation, Zurück, Hauptmenü und bestehende Aktions-Buttons testen.
- Die Integrationsversion bleibt **0.0.32**. Keine Versionsanhebung und kein GitHub-Tag/Release.

**Status:** Änderungen auf `main` eingespielt; Laufzeittest in Home Assistant steht noch aus.
