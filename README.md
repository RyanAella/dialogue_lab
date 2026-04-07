# Lab für Sozioinformatik: Gesprächstraining

## 1. Übersicht

Das **Lab für Sozioinformatik: Gesprächstraining** ist eine webbasierte Anwendung zum Trainieren von Gesprächsführung und Ich-Botschaften. Die App unterstützt aktuell zwei Modi:

- **Gesprächstraining**: Rollenbasierte Dialogsimulation mit Szenarien und optionalem Mentor-Feedback
- **Ich-Botschaften**: Interaktive Umformulierung von Du-Botschaften mit kurzem KI-Feedback

## 2. Technische Architektur

Die Anwendung kombiniert ein statisches Frontend mit einem serverseitigen Proxy (für API-Key-Schutz):

- **Frontend**: Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript), z.B. gehostet auf **GitHub Pages**.
- **Backend-Proxy**: Ein kleines serverseitiges Skript (z.B. PHP `chat.php`) auf einem beliebigen Webserver/Hosting. Das ist notwendig, da API-Keys niemals im Client-Code (JavaScript) stehen dürfen.
- **Sicherheit (CORS)**: Der Proxy sollte nur Anfragen vom **Origin** akzeptieren, auf dem die Web-App läuft (z.B. `https://ryanaella.github.io`). Wichtig: **Origin = Schema + Domain**, nicht der Pfad (also nicht `.../dialogue_lab/`).
- **KI-Modell**: OpenAI (wird in `app.js` als `model` übergeben).

## 3. Repository-Dateistruktur

- `index.html`: UI / Layout.
- `config.js`: Zentrale Runtime-Konfiguration (Proxy-URL, Modell, Temperaturen).
- `app.js`: Zentrale Logik (Modi, Szenario-Parsing, Chat-Management, Proxy-Aufrufe).
- `scenarios/`: Szenario- und Modus-Dateien (`index.json`, `*.txt`, `ich_botschaft_mode.json`).
- `prompts/`: Prompt-Dateien in Unterordnern `system/`, `partner/`, `mentor/`.

Hinweis: Ein serverseitiges Proxy-Skript wie `chat.php` ist **nicht zwingend Teil dieses Repositories**. Es kann getrennt auf dem Server liegen, damit keine Secrets im Repo landen.

## 4. Szenarien und Modi

### 4.1 Szenario-Index (`scenarios/index.json`)

Die Szenarioliste für den Gesprächsmodus wird aus `scenarios/index.json` geladen:

```json
{
  "scenarioFiles": [
    "reporting_scenario.txt",
    "difficulties_scenario.txt"
  ]
}
```

Wenn die Datei fehlt/ungültig ist, nutzt die App einen internen Fallback.

### 4.2 Gesprächs-Szenarioformat (`*.txt`)

Ein Gesprächsszenario wird über eine Textdatei in `scenarios/` gesteuert. `app.js` parst die Datei anhand von Markern.

#### Der META-Block

```text
### META ###
title: Kritikgespräch: Verspätetes Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

_Die Prompt-Namen referenzieren Dateinamen in `prompts/<typ>/…` (ohne `.txt`)._

Optional (wenn genutzt): `role_label: Mitarbeiter` (überschreibt die automatische Rollen-Erkennung im UI).

#### Die GUI Instruction

Alles nach dem Marker `### GUI INSTRUCTION ###` wird als Briefing angezeigt. Falls `role_label` nicht gesetzt ist, versucht die App, die Rolle heuristisch aus dem Text zu erkennen, um Labels/Platzhalter im Chat anzupassen.

#### Validierung beim Laden

Beim Laden eines Szenarios prüft die App verpflichtend:

- Marker `### GUI INSTRUCTION ###` vorhanden
- `system_prompt`, `partner_prompt` und `mentor_prompt` im META-Block vorhanden
- GUI-Instruction nicht leer

Wenn eine dieser Bedingungen nicht erfüllt ist, zeigt die App eine klare Fehlermeldung im Status/Briefing statt stillschweigend mit unvollständigen Daten weiterzulaufen.

### 4.3 Ich-Botschaften-Modus

Der Ich-Botschaften-Modus ist dateibasiert konfiguriert:

- `scenarios/ich_botschaft_mode.json`:
  - `statementsFile` (Liste der Aussagen)
  - `feedbackPromptFile` (System-Prompt für Feedback)
- `scenarios/ich_botschaft_statements.txt`: Eine Aussage pro Zeile
- `prompts/system/ich_botschaft_feedback_prompt.txt`: Feedback-Instruktion für das Modell

## 5. Lokale Entwicklung

- Projekt in VS Code öffnen
- Mit einem statischen Server starten (z.B. „Live Server“)
- Hinweis: Für echte API-Calls braucht die App eine erreichbare Proxy-URL (siehe nächster Abschnitt)

## 6. Proxy-Setup (serverseitig) & Sicherheit

Da das Frontend statisch ist, muss die Kommunikation mit der OpenAI API über einen serverseitigen Proxy erfolgen (z.B. `chat.php`), damit der API-Key nicht im Browser landet.

### 6.1 API-Key

- Der OpenAI API-Schlüssel darf **niemals** im Frontend-Code stehen.
- Hinterlege den Key ausschließlich **serverseitig** (z.B. als Umgebungsvariable oder in einer Konfigurationsdatei, die nicht versioniert wird).
- Der Proxy setzt den Header `Authorization: Bearer ...` serverseitig.

### 6.2 CORS / Origin-Whitelist

- Der Proxy sollte nur Requests vom **Origin** der Webanwendung akzeptieren (z.B. `https://ryanaella.github.io`).
- Vermeide nach Möglichkeit `Access-Control-Allow-Origin: *`, damit nicht beliebige Webseiten den Proxy missbrauchen können.

## 7. Deployment (Beispiel: GitHub Pages + eigener Proxy)

1. **Frontend**: Repository pushen und GitHub Pages aktivieren.
2. **Proxy**: Proxy-Skript auf deinem Webserver deployen (HTTPS empfohlen).
3. **Frontend-Konfiguration**: In `app.js` die Proxy-URL konsistent verwenden (z.B. eine Konstante `PROXY_URL`) und alle API-Calls darüber laufen lassen.

### 7.1 Frontend-Konfiguration

Laufzeitwerte werden in `config.js` gepflegt (z.B. Modell und Temperaturwerte). `index.html` lädt zuerst `config.js`, danach `app.js`.

## 8. Neues Gesprächsszenario hinzufügen

1. Prompt-Dateien als `.txt` anlegen:
   - `prompts/system/<name>.txt`
   - `prompts/partner/<name>.txt`
   - `prompts/mentor/<name>.txt` (optional, falls Feedback genutzt wird)
2. Neue Datei in `scenarios/` erstellen (mit `### META ###` und `### GUI INSTRUCTION ###`).
3. Dateiname in `scenarios/index.json` unter `scenarioFiles` ergänzen.
4. Deployen – die App listet das Szenario im Dropdown.

## 9. Ich-Botschaften-Inhalte pflegen

1. Aussagen in `scenarios/ich_botschaft_statements.txt` bearbeiten (eine Aussage pro Zeile).
2. Prompt in `prompts/system/ich_botschaft_feedback_prompt.txt` anpassen.
3. Falls Pfade geändert werden, `scenarios/ich_botschaft_mode.json` aktualisieren.

---

_Hinweis: Ein Klick auf „Neustart“ setzt die Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

# Socio-Informatics Lab: Dialogue Training

## 1. Overview

The **Socio-Informatics Lab: Dialogue Training** is a web-based application for communication practice and I-message training. The app currently supports two modes:

- **Dialogue Training**: Scenario-based roleplay with optional mentor feedback
- **I-Message Training**: Interactive rewriting of accusatory statements into constructive I-messages with short AI feedback

## 2. Technical Architecture

The application combines a static frontend with a server-side proxy (to protect the API key):

- **Frontend**: Static website (HTML5, Tailwind CSS, Vanilla JavaScript), e.g. hosted on **GitHub Pages**.
- **Backend proxy**: A small server-side script (e.g. PHP `chat.php`) running on any web server/hosting. This is required because API keys must never be exposed in client-side code.
- **Security (CORS)**: The proxy should only accept requests from the web app’s **origin** (e.g. `https://ryanaella.github.io`). Important: **origin = scheme + domain**, not the path (so not `.../dialogue_lab/`).
- **AI model**: OpenAI (passed as `model` from `app.js`).

## 3. Repository File Structure

- `index.html`: UI / layout.
- `config.js`: Central runtime configuration (proxy URL, model, temperatures).
- `app.js`: Core logic (modes, scenario parsing, chat management, proxy calls).
- `scenarios/`: Scenario and mode files (`index.json`, `*.txt`, `ich_botschaft_mode.json`).
- `prompts/`: Prompt files in `system/`, `partner/`, `mentor/`.

Note: A server-side proxy script like `chat.php` does **not** have to live in this repository. Keeping it separate helps prevent accidental commits of secrets.

## 4. Scenarios and Modes

### 4.1 Scenario Index (`scenarios/index.json`)

The list of dialogue scenarios is loaded from `scenarios/index.json`:

```json
{
  "scenarioFiles": [
    "reporting_scenario.txt",
    "difficulties_scenario.txt"
  ]
}
```

If the file is missing or invalid, the app falls back to an internal default list.

### 4.2 Dialogue Scenario Format (`*.txt`)

Dialogue scenarios are controlled via text files in `scenarios/`. `app.js` parses them using markers.

#### The META Block

```text
### META ###
title: Feedback Meeting: Late Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

_Prompt names reference files in `prompts/<type>/…` (without the `.txt` extension)._

Optional (if used): `role_label: Employee` (overrides heuristic role detection in the UI).

#### The GUI Instruction

Everything after `### GUI INSTRUCTION ###` is shown as the briefing. If `role_label` is not set, the app tries to detect the role heuristically from the text to customize chat labels and placeholders.

#### Runtime Validation

When loading a scenario, the app validates that:

- the `### GUI INSTRUCTION ###` marker exists
- `system_prompt`, `partner_prompt`, and `mentor_prompt` exist in the META block
- the GUI instruction section is not empty

If any of these checks fail, the app shows a clear error message in status/briefing instead of continuing with incomplete data.

### 4.3 I-Message Mode

The I-message mode is configured via files:

- `scenarios/ich_botschaft_mode.json`:
  - `statementsFile` (list of statements)
  - `feedbackPromptFile` (system prompt used for feedback)
- `scenarios/ich_botschaft_statements.txt`: one statement per line
- `prompts/system/ich_botschaft_feedback_prompt.txt`: feedback instruction prompt

## 5. Local Development

- Open the project in VS Code
- Serve it with a static server (e.g. “Live Server”)
- Note: Real API calls require a reachable proxy URL (see next section)

## 6. Proxy Setup (Server-Side) & Security

Because the frontend is static, calls to the OpenAI API must go through a server-side proxy (e.g. `chat.php`) so the API key never reaches the browser.

### 6.1 API key

- The OpenAI API key must **never** be stored in client-side code.
- Store the key **server-side only** (e.g. as an environment variable or in a non-versioned config file).
- The proxy sets the `Authorization: Bearer ...` header on the server.

### 6.2 CORS / origin whitelist

- The proxy should only allow requests from the web app’s **origin** (e.g. `https://ryanaella.github.io`).
- Avoid `Access-Control-Allow-Origin: *` where possible to prevent other sites from abusing your proxy.

## 7. Deployment (Example: GitHub Pages + your proxy)

1. **Frontend**: Push the repository and enable GitHub Pages.
2. **Proxy**: Deploy the proxy script to your web server (HTTPS recommended).
3. **Frontend configuration**: Use a single proxy URL in `app.js` (e.g. a `PROXY_URL` constant) and route all API calls through it.

### 7.1 Frontend Configuration

Runtime values are maintained in `config.js` (e.g. model and temperature values). `index.html` loads `config.js` before `app.js`.

## 8. How to Add a New Dialogue Scenario

1. Create prompt files as `.txt`:
   - `prompts/system/<name>.txt`
   - `prompts/partner/<name>.txt`
   - `prompts/mentor/<name>.txt` (optional, if mentor feedback is used)
2. Create a new scenario file in `scenarios/` using the `### META ###` and `### GUI INSTRUCTION ###` format.
3. Add the scenario filename to `scenarios/index.json` under `scenarioFiles`.
4. Deploy — the scenario will appear in the dropdown.

## 9. Maintaining I-Message Content

1. Edit statements in `scenarios/ich_botschaft_statements.txt` (one per line).
2. Adjust the feedback prompt in `prompts/system/ich_botschaft_feedback_prompt.txt`.
3. If paths change, update `scenarios/ich_botschaft_mode.json`.

---

_Note: Clicking “Restart” resets the application and clears the current chat history from the browser's memory._

