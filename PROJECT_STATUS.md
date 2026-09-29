# Telegram Menu via Keyboard – Projektstatus

> Zentrale Projektdokumentation für die Weiterentwicklung der Home-Assistant-Integration **Telegram Menu via Keyboard**. Diese Datei wird bei größeren Entwicklungsschritten aktualisiert.

## 1. Repository
- GitHub Repository: `The-Fox23/telegram-menu-via-keybord`
- Geplanter Zielname: `telegram-menu-via-keyboard`
- Integration Domain: `telegram_menu`
- Anzeigename: **Telegram Menu via Keyboard**
- Aktuelle Version: 0.0.16
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
- Mehrere Aktionen pro Button fehlen noch.
- Aktuell wird pro Button nur die erste konfigurierte Aktion gespeichert/ausgeführt.
- Service-Datenfelder (z. B. Helligkeit, Farbe, Nachrichtentext) werden noch nicht grafisch bearbeitet.
- Untermenüs fehlen noch.
- Bedingungen fehlen noch.
- Die native HA-Entity-Auswahl hängt vom aktuellen Lazy-Loading-Zustand des Home-Assistant-Frontends ab; der Such-Fallback verhindert dabei eine unbrauchbare leere Auswahl.

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
