# Lab für Sozioinformatik: Simulation Lab

> **Hinweis:** Dies ist eine spezialisierte Version der Anwendung. Im Gegensatz zur Hauptversion (Main) konzentriert sich dieser Stand ausschließlich auf **Dialogsimulationen** (Rollenspiele) und enthält keinen Übungs-Modus für Transformationen (Umformulierungen).

## 1. Übersicht

Das **Lab für Sozioinformatik: Simulation Lab** ist eine webbasierte Anwendung zum Trainieren von Gesprächsführung durch rollenbasierte Dialogsimulationen mit KI-Partnern und optionalem Mentor-Feedback.

## 2. Technische Architektur

Die Anwendung kombiniert ein statisches Frontend mit einem serverseitigen Proxy (für API-Key-Schutz):

- **Frontend**: Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript), z.B. gehostet auf **GitHub Pages**.
- **Backend-Proxy**: Ein kleines serverseitiges Skript (z.B. PHP `chat.php`) auf einem beliebigen Webserver/Hosting. Das ist notwendig, da API-Keys niemals im Client-Code (JavaScript) stehen dürfen.
- **Sicherheit (CORS)**: Der Proxy sollte nur Anfragen vom **Origin** akzeptieren, auf dem die Web-App läuft (z.B. `https://ryanaella.github.io`). Wichtig: **Origin = Schema + Domain**, nicht der Pfad (also nicht `.../dialogue_lab/`).
- **KI-Modell**: OpenAI (Konfigurationswerte aus `src/js/config.js` werden von der `app.js` als Parameter an die Methoden der `api.js` übergeben).

## 3. Repository-Dateistruktur

- `index.html`: UI / Layout.
- `src/js/config.js`: Zentrale Runtime-Konfiguration (Proxy-URL, Modell, Temperaturen).
- `src/js/utils.js`: Hilfsfunktionen für Text-Parsing, Markdown-Rendering und Rollen-Erkennung.
- `src/js/api.js`: Verwaltet die Kommunikation mit dem Proxy und das Laden/Parsen von Szenario- und Prompt-Dateien.
- `src/js/ui.js`: Zuständig für alle DOM-Manipulationen und die visuelle Darstellung der Benutzeroberfläche.
- `src/js/app.js`: Zentrale Anwendungslogik (State-Management, Event-Handling, Modus-Steuerung) als Controller.
- `scenarios/`: Szenario-Dateien (`exercises.json` als zentrale Konfiguration, `*.txt` für Szenarioinhalte).
- `prompts/`: Prompt-Dateien in Unterordnern `system/`, `partner/`, `mentor/`.

Hinweis: Ein serverseitiges Proxy-Skript wie `chat.php` ist **nicht zwingend Teil dieses Repositories**. Es kann getrennt auf dem Server liegen, damit keine Secrets im Repo landen.

## 4. Szenarien und Modi

### 4.1 Szenario-Konfiguration (`exercises.json`)

Die zentrale Konfiguration aller Simulationen erfolgt über `exercises.json`. Diese Datei definiert die `id`, den `type` (`SIMULATION`) und die `config` für jedes Szenario.

```json
[
  {
    "id": "simulation_reporting",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/reporting_scenario.txt"
    }
  }
]
```

- `scenarioFile`: Für `SIMULATION`-Übungen, enthält das Briefing und alle Prompt-Referenzen im META-Block.
- **Hinweis**: Die eigentlichen Prompts (`..._prompt.txt`) werden innerhalb der `scenarioFile` im `META`-Block referenziert.

### 4.2 Szenarioformat (`*.txt`)

### Format des META-Blocks

**Variante A: Simulationen (Gesprächstraining)**
Wird genutzt, wenn in der `exercises.json` der Typ `SIMULATION` gesetzt ist.

**Variante B: Transformationen (Übung-Modus)**  
_(In dieser Edition nicht enthalten)_

```text
### META ###
title: Kritikgespräch: Verspätetes Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

- `system_prompt`, `partner_prompt`, `mentor_prompt`: Referenzieren die jeweiligen Dateien in den Unterordnern von `prompts/`.

#### Die GUI Instruction

Alles nach dem Marker `### GUI INSTRUCTION ###` wird als Briefing angezeigt. Falls `role_label` nicht gesetzt ist, versucht die App, die Rolle heuristisch aus dem Text zu erkennen, um Labels/Platzhalter im Chat anzupassen.

#### Validierung beim Laden

Beim Laden eines Szenarios prüft die App verpflichtend:

- Marker `### GUI INSTRUCTION ###` vorhanden
- **Simulation**: Prüft auf `system_prompt`, `partner_prompt` und `mentor_prompt`.
- GUI-Instruction nicht leer

Wenn eine dieser Bedingungen nicht erfüllt ist, zeigt die App eine klare Fehlermeldung im Status/Briefing statt stillschweigend mit unvollständigen Daten weiterzulaufen.

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

### 6.3 Referenz-Implementierung (`chat.php`)

Das Skript sollte auf dem Server (z. B. unter `/var/www/dialogue_lab/chat.php`) abgelegt werden. Hier ist eine Vorlage:

```php
<?php
// --- OPEN THE DOOR (CORS) ---

// Allow requests from GitHub and localhost
$allowed_origins = [
    "https://ryanaella.github.io",
    "http://localhost",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// --- THE POSTMAN ---
$api_key = 'YOUR_API_KEY';
$url = 'https://api.openai.com/v1/chat/completions';

// Receive request payload from browser
$jsonInput = file_get_contents('php://input');

$decoded = json_decode($jsonInput);
if ($decoded === null) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode([
        'error' => [
            'message' => 'PHP received invalid JSON from Frontend',
            'php_error' => json_last_error_msg(),
            'received_length' => strlen($jsonInput),
            'received_start' => substr($jsonInput, 0, 100)
        ]
    ]);
    exit;
}

// Forward the payload (unopened, but with API key) to OpenAI
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonInput);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $api_key
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

header('Content-Type: application/json');

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => curl_error($ch)]]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
```

## 7. Deployment (Beispiel: GitHub Pages + eigener Proxy)

1. **Frontend**: Repository pushen. Der GitHub Actions Workflow (`deploy.yml`) übernimmt das Deployment automatisch.
2. **Proxy**: Proxy-Skript auf deinem Webserver deployen (HTTPS empfohlen).
3. **Frontend-Konfiguration**: In `app.js` die Proxy-URL konsistent verwenden (z.B. eine Konstante `PROXY_URL`) und alle API-Calls darüber laufen lassen.

### 7.1 Multi-Branch Deployment

Die Anwendung nutzt ein dynamisches Deployment-Modell. Jeder Push auf einen Branch löst ein Deployment aus:

- **Main-Branch**: Erreichbar unter der Root-URL (z. B. `https://ryanaella.github.io/dialogue_lab/`).
- **Andere Branches**: Erreichbar in Unterordnern (z. B. `https://ryanaella.github.io/dialogue_lab/simulation-lab/`).
  Dies erlaubt es, spezialisierte Versionen für Partner oder Tests parallel bereitzustellen, ohne die Hauptversion zu beeinflussen.

### 7.2 Frontend-Konfiguration

Laufzeitwerte (Modell, Temperaturen, Proxy-URL) werden in `src/js/config.js` gepflegt. Die `app.js` orchestriert den Datenfluss, indem sie diese Werte ausliest und bei Bedarf an die zustandslosen Funktionen in der `api.js` weiterreicht.

## 8. Neues Gesprächsszenario hinzufügen

1. Prompt-Dateien als `.txt` anlegen:
   - `prompts/system/<name>.txt`
   - `prompts/partner/<name>.txt`
   - `prompts/mentor/<name>.txt` (optional, falls Feedback genutzt wird)
2. Neue Datei in `scenarios/simulations/` erstellen (mit `### META ###` und `### GUI INSTRUCTION ###`).
3. Eintrag in `exercises.json` ergänzen.
4. Deployen – die App listet das Szenario im Dropdown.

## 9. Inhalte pflegen

1. Szenario-Dateien unter `scenarios/simulations/` bearbeiten (Inhalt und GUI Instruction).
2. Prompt-Dateien in `prompts/` (system, partner, mentor) anpassen.
3. Falls neue Szenarien hinzugefügt werden, `exercises.json` aktualisieren.

---

_Hinweis: Ein Klick auf „Neustart“ setzt die Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

# Socio-Informatics Lab: Simulation Lab

> **Note:** This is a specialized version of the application. Unlike the main version, this build focuses exclusively on **Dialogue Simulations** (Roleplays) and does not include the Transformation exercise mode (rewriting).

## 1. Overview

The **Socio-Informatics Lab: Simulation Lab** is a web-based application for practicing communication through roleplay-based dialogue simulations with AI partners and optional mentor feedback.

## 2. Technical Architecture

The application combines a static frontend with a server-side proxy (to protect the API key):

- **Frontend**: Static website (HTML5, Tailwind CSS, Vanilla JavaScript), e.g., hosted on **GitHub Pages**.
- **Backend Proxy**: A small server-side script (e.g., PHP `chat.php`) on any web server/hosting. This is required because API keys must never be exposed in client-side code (JavaScript).
- **Security (CORS)**: The proxy should only accept requests from the **Origin** on which the web app is running (e.g., `https://ryanaella.github.io`). Important: **Origin = Schema + Domain**, not the path (i.e., not `.../dialogue_lab/`).
- **AI Model**: OpenAI (configuration values from `src/js/config.js` are passed as parameters by `app.js` to the methods in `api.js`).

## 3. Repository File Structure

- `index.html`: UI / Layout.
- `src/js/config.js`: Central runtime configuration (proxy URL, model, temperatures).
- `src/js/utils.js`: Utility functions for text parsing, Markdown rendering, and role detection.
- `src/js/api.js`: Manages communication with the proxy and loading/parsing of scenario and prompt files.
- `src/js/ui.js`: Responsible for all DOM manipulations and visual rendering of the user interface.
- `src/js/app.js`: Core application logic (state management, event handling, mode control) as a controller.
- `scenarios/`: Scenario files (`exercises.json` as central configuration, `*.txt` for scenario content).
- `prompts/`: Prompt files in subfolders `system/`, `partner/`, `mentor/`.

Note: A server-side proxy script like `chat.php` is **not necessarily part of this repository**. It can be hosted separately to ensure no secrets are stored in the repo.

## 4. Scenarios and Modes

### 4.1 Scenario Configuration (`exercises.json`)

The central configuration for all simulations is handled via `exercises.json`. This file defines the `id`, the `type` (`SIMULATION`), and the `config` for each scenario.

```json
[
  {
    "id": "simulation_reporting",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/reporting_scenario.txt"
    }
  }
]
```

- `scenarioFile`: For `SIMULATION` exercises, contains the briefing and all prompt references in the META block.
- **Note**: The actual prompts (`..._prompt.txt`) are referenced within the `scenarioFile` in the `META` block.

### 4.2 Scenario Format (`*.txt`)

### META Block Format

**Option A: Simulations (Dialogue Training)**
Used when the type is set to `SIMULATION` in `exercises.json`.

**Option B: Transformations (Exercise Mode)**  
_(Not available in this edition)_

```text
### META ###
title: Feedback Meeting: Late Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

#### The GUI Instruction

Everything after the `### GUI INSTRUCTION ###` marker is displayed as the briefing. If `role_label` is not set, the app attempts to detect the role heuristically from the text to adjust labels and placeholders in the chat.

#### Runtime Validation

When loading a scenario, the app mandatory checks:

- Presence of the `### GUI INSTRUCTION ###` marker.
- **Simulation**: Presence of `system_prompt`, `partner_prompt`, and `mentor_prompt`.
- GUI instruction is not empty.

If any of these conditions are not met, the app displays a clear error message in the status/briefing instead of silently continuing with incomplete data.

## 5. Local Development

- Open the project in VS Code.
- Start with a static server (e.g., "Live Server").
- Note: For real API calls, the app needs an accessible proxy URL (see next section).

## 6. Proxy Setup (Server-Side) & Security

Since the frontend is static, communication with the OpenAI API must go through a server-side proxy (e.g., `chat.php`) so that the API key does not end up in the browser.

### 6.1 API Key

- The OpenAI API key must **never** be included in the frontend code.
- Store the key exclusively **server-side** (e.g., as an environment variable or in a configuration file that is not versioned).
- The proxy sets the `Authorization: Bearer ...` header server-side.

### 6.2 CORS / Origin Whitelist

- The proxy should only allow requests from the **Origin** of the web application (e.g., `https://ryanaella.github.io`).
- Avoid `Access-Control-Allow-Origin: *` where possible to prevent unauthorized websites from abusing the proxy.

### 6.3 Reference Implementation (`chat.php`)

The script should be placed on the server (e.g., at `/var/www/dialogue_lab/chat.php`). Here is the current template:

```php
<?php
// --- OPEN THE DOOR (CORS) ---

// Allow requests from GitHub and localhost
$allowed_origins = [
    "https://ryanaella.github.io",
    "http://localhost",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// --- THE POSTMAN ---
$api_key = 'YOUR_API_KEY';
$url = 'https://api.openai.com/v1/chat/completions';

// Receive request payload from browser
$jsonInput = file_get_contents('php://input');

$decoded = json_decode($jsonInput);
if ($decoded === null) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode([
        'error' => [
            'message' => 'PHP received invalid JSON from Frontend',
            'php_error' => json_last_error_msg(),
            'received_length' => strlen($jsonInput),
            'received_start' => substr($jsonInput, 0, 100)
        ]
    ]);
    exit;
}

// Forward the payload (unopened, but with API key) to OpenAI
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonInput);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $api_key
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

header('Content-Type: application/json');

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => curl_error($ch)]]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
```

## 7. Deployment (Example: GitHub Pages + Own Proxy)

1. **Frontend**: Push the repository. The GitHub Actions workflow (`deploy.yml`) handles the deployment automatically.
2. **Proxy**: Deploy the proxy script to your web server (HTTPS recommended).
3. **Frontend Configuration**: Use the proxy URL consistently in `app.js` (e.g., via a constant `PROXY_URL`) and route all API calls through it.

### 7.1 Multi-Branch Deployment

The application uses a dynamic deployment model. Every push to a branch triggers a deployment:

- **Main Branch**: Accessible at the root URL (e.g., `https://ryanaella.github.io/dialogue_lab/`).
- **Other Branches**: Accessible in subdirectories (e.g., `https://ryanaella.github.io/dialogue_lab/simulation-lab/`).
  This allows providing specialized versions for partners or testing in parallel without affecting the main version.

### 7.2 Frontend Configuration

Runtime values (model, temperatures, proxy URL) are maintained in `src/js/config.js`. The `app.js` orchestrates the data flow by reading these values and passing them to the stateless functions in `api.js` as needed.

## 8. How to Add a New Dialogue Scenario

1. Create prompt files as `.txt`:
   - `prompts/system/<name>.txt`
   - `prompts/partner/<name>.txt`
   - `prompts/mentor/<name>.txt` (optional, if feedback is used)
2. Create a new file in `scenarios/simulations/` (with `### META ###` and `### GUI INSTRUCTION ###`).
3. Add an entry to `exercises.json`.
4. Deploy – the app lists the scenario in the dropdown.

## 9. Maintaining Content

1. Edit scenario files in `scenarios/simulations/` (content and GUI instructions).
2. Adjust prompt files in `prompts/` (system, partner, mentor).
3. Update `exercises.json` if new scenarios are added.

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's memory._
