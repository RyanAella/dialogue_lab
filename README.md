# Lab für Sozioinformatik: Gesprächstraining

## 1. Das Projekt auf einen Blick

Das **Lab für Sozioinformatik: Gesprächstraining** ist eine interaktive Web-Anwendung, die die Brücke zwischen psychologischer Gesprächsführung und moderner KI schlägt. Nutzer können hier in einem geschützten Raum schwierige Gesprächssituationen trainieren oder gezielt an ihrer Ausdrucksweise arbeiten.

### Kernfunktionen & Modi

Die Anwendung bietet zwei spezialisierte Trainingsumgebungen:

- **Interaktive Simulationen (Rollenspiel)**
  Tauche in realistische Gesprächsszenarien ein. Ein KI-Gegenüber reagiert dynamisch auf deine Eingaben, während ein optionaler **KI-Mentor** im Hintergrund wertvolles Feedback zu deiner Strategie gibt.
- **Gezielte Übungen (Transformation)**
  Hier liegt der Fokus auf der Technik. Trainiere das Umformulieren von Vorwürfen in konstruktive Botschaften (z. B. Ich-Botschaften oder Positive Unterstellungen). Die KI bewertet deine Versuche sofort und gibt Tipps zur Verbesserung.

### Highlights für die User Experience

- **Natürliches Sprachgefühl:** Dank integrierter **Sprachausgabe (TTS)** mit optimierter Betonung werden die Dialoge lebendig. (Tipp: In Microsoft Edge klingen die Stimmen besonders menschlich!)
- **Fortschritt sichern:** Über den **Protokoll-Export** lässt sich der gesamte Gesprächsverlauf inklusive Briefing mit einem Klick als strukturierte Textdatei speichern – ideal für die Nachbereitung oder zur Dokumentation von Lernfortschritten.

## 2. Technische Architektur

Die Anwendung kombiniert ein statisches Frontend mit einem serverseitigen Proxy (für API-Key-Schutz):

- **Frontend**: Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript), z.B. gehostet auf **GitHub Pages**.
- **Backend-Proxy**: Ein kleines serverseitiges Skript (z.B. PHP `chat.php`) auf einem beliebigen Webserver/Hosting. Das ist notwendig, da API-Keys niemals im Client-Code (JavaScript) stehen dürfen.
- **Sicherheit (CORS)**: Der Proxy sollte nur Anfragen vom **Origin** akzeptieren, auf dem die Web-App läuft (z.B. `https://ryanaella.github.io`). Wichtig: **Origin = Schema + Domain**, nicht der Pfad (also nicht `.../dialogue_lab/`).
- **KI-Modell**: OpenAI (Konfigurationswerte aus `config.js` werden von der `app.js` als Parameter an die Methoden der `api.js` übergeben).

## 3. Repository-Dateistruktur

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Zentrale Runtime-Konfiguration (Proxy-URL, Modell, Temperaturen).
  - `utils.js`: Hilfsfunktionen für Text-Parsing, Markdown-Rendering und Rollen-Erkennung.
  - `api.js`: Verwaltet die Kommunikation mit dem Proxy und das Laden/Parsen von Szenario- und Prompt-Dateien.
  - `ui.js`: Zuständig für alle DOM-Manipulationen und die visuelle Darstellung der Benutzeroberfläche.
  - `app.js`: Zentrale Anwendungslogik (State-Management, Event-Handling, Modus-Steuerung) als Controller.
- `scenarios/`: Szenario- und Übungsdateien (`exercises.json` als zentrale Konfiguration, `*.txt` für Szenarioinhalte).
- `prompts/`: Prompt-Dateien in Unterordnern `system/`, `partner/`, `mentor/`, `trainers/`.

Hinweis: Ein serverseitiges Proxy-Skript wie `chat.php` ist **nicht zwingend Teil dieses Repositories**. Es kann getrennt auf dem Server liegen, damit keine Secrets im Repo landen.

## 4. Szenarien und Modi

### 4.1 Übungs- und Szenario-Konfiguration (`exercises.json`)

Die zentrale Konfiguration aller Simulationen und Transformationen erfolgt über `exercises.json`. Diese Datei definiert die `id`, den `type` (`SIMULATION` oder `TRANSFORMATION`) und die `config` für jede Übung.

```json
[
  {
    "id": "ich_botschaften_basis",
    "type": "TRANSFORMATION",
    "config": {
      "sourceFile": "scenarios/transformations/ich_botschaft_statements.txt",
      "instructionFile": "scenarios/transformations/ich_botschaft_instructions.txt"
    }
  },
  {
    "id": "simulation_reporting",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/reporting_scenario.txt"
    }
  }
]
```

- `sourceFile`: Für `TRANSFORMATION`-Übungen, enthält die Liste der umzuformulierenden Aussagen (eine pro Zeile).
- `instructionFile`: Für `TRANSFORMATION`-Übungen, enthält das Briefing und den Trainer-Prompt im META-Block.
- `scenarioFile`: Für `SIMULATION`-Übungen, enthält das Briefing und alle Prompt-Referenzen im META-Block.

### 4.2 Szenarioformat (`*.txt`)

#### Der META-Block

Die Felder im `META`-Block sind nun strikt nach dem Übungstyp getrennt, um Inkonsistenzen zu vermeiden. Der `title` ist das einzige Feld, das in jedem Modus vorhanden sein muss.

**Variante A: Simulationen (Gesprächstraining)**
Wird genutzt, wenn in der `exercises.json` der Typ `SIMULATION` gesetzt ist.

```text
### META ###
title: Kritikgespräch: Verspätetes Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

- `system_prompt`, `partner_prompt`, `mentor_prompt`: Referenzieren die jeweiligen Dateien in den Unterordnern von `prompts/`.

**Variante B: Transformationen (Übung-Modus)**
Wird genutzt, wenn in der `exercises.json` der Typ `TRANSFORMATION` gesetzt ist.

```text
### META ###
title: Positive Unterstellung
trainer_prompt: positive_unterstellung_trainer
short_instruction: Identifiziere die positive Ich- und Du-Botschaft
```

- `trainer_prompt`: Referenziert die Datei im Ordner `prompts/trainers/`.
- `short_instruction`: Ein String, der im UI als direkte Handlungsanweisung über dem Chat-Eingabebereich erscheint.

#### Die GUI Instruction

Alles nach dem Marker `### GUI INSTRUCTION ###` wird als Briefing angezeigt. Falls `role_label` nicht gesetzt ist, versucht die App, die Rolle heuristisch aus dem Text zu erkennen, um Labels/Platzhalter im Chat anzupassen.

#### Validierung beim Laden

Beim Laden eines Szenarios prüft die App verpflichtend:

- Marker `### GUI INSTRUCTION ###` vorhanden
- **Simulation**: Prüft auf `system_prompt`, `partner_prompt` und `mentor_prompt`.
- **Transformation**: Prüft auf `trainer_prompt` und `short_instruction`.
- GUI-Instruction nicht leer

Wenn eine dieser Bedingungen nicht erfüllt ist, zeigt die App eine klare Fehlermeldung im Status/Briefing statt stillschweigend mit unvollständigen Daten weiterzulaufen.

### 4.3 Übungs-Modus (Transformationen)

Der Übungs-Modus (ehemals Ich-Botschaften-Modus) ist über die `exercises.json` konfiguriert. Er nutzt Transformation-Szenarien, um spezifische Techniken zu trainieren.

- `sourceFile` (z.B. `scenarios/transformations/ich_botschaft_statements.txt`): Enthält eine Liste von Aussagen (eine pro Zeile).
- `instructionFile` (z.B. `scenarios/transformations/ich_botschaft_instructions.txt`): Enthält das Briefing und den `trainer_prompt` im META-Block.

UI-Verhalten im Ich-Botschaften-Modus:

- Szenarioauswahl wird ausgeblendet
- Modus-Badge zeigt den aktiven Modus
- Nachrichten sind visuell getrennt (`Aufgabe` vs. `Feedback`)
- Übungsaktionen stehen direkt unter dem Chat-Eingabebereich:
  - `Überarbeiten`
  - `Nächste Aussage`
  - `Übung neu starten`

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
  - **Hinweis für lokale Entwicklung**: Für Tests von `localhost` aus muss `http://localhost` (ggf. mit Port, z.B. `http://localhost:5500`) ebenfalls in den `Access-Control-Allow-Origin`-Headern des Proxy-Skripts auf dem Server erlaubt werden. Im Produktivbetrieb sollte dies wieder entfernt werden.

### 6.3 Referenz-Implementierung (`chat.php`)

Das Skript sollte auf dem Server (z. B. unter `/var/www/html/dialogue_lab/chat.php`) abgelegt werden. Hier ist eine Vorlage:

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
3. **Frontend-Konfiguration**: Die `PROXY_URL` in `src/js/config.js` so anpassen, dass sie auf den tatsächlichen Pfad des Proxy-Skripts auf dem Server zeigt (z. B. `https://kite2.site/dialogue_lab/chat.php`).

### 7.1 Multi-Branch Deployment

Die Anwendung nutzt ein dynamisches Deployment-Modell. Jeder Push auf einen Branch löst ein Deployment aus:

- **Main-Branch**: Erreichbar unter der Root-URL (z. B. `https://ryanaella.github.io/dialogue_lab/`).
- **Andere Branches**: Erreichbar in Unterordnern (z. B. `https://ryanaella.github.io/dialogue_lab/exercises-only/`).
  Dies erlaubt es, spezialisierte Versionen für Partner oder Tests parallel bereitzustellen, ohne die Hauptversion zu beeinflussen.

### 7.2 Frontend-Konfiguration

Laufzeitwerte (Modell, Temperaturen, Proxy-URL) werden in `src/js/config.js` gepflegt. Die `app.js` orchestriert den Datenfluss, indem sie diese Werte ausliest und bei Bedarf an die zustandslosen Funktionen in der `api.js` weiterreicht.

## 8. Neues Gesprächsszenario hinzufügen

1. Prompt-Dateien als `.txt` anlegen:
   - `prompts/system/<name>.txt`
   - `prompts/partner/<name>.txt`
   - `prompts/mentor/<name>.txt` (optional, falls Feedback genutzt wird)
   - `prompts/trainers/<name>.txt` (für Übungen / Transformationen)
2. Neue Datei in `scenarios/` erstellen (mit `### META ###` und `### GUI INSTRUCTION ###`).
3. Eintrag in `exercises.json` ergänzen.
4. Deployen – die App listet das Szenario im Dropdown.

## 9. Ich-Botschaften-Inhalte pflegen

1. Aussagen in der jeweiligen `sourceFile` bearbeiten (z.B. `scenarios/transformations/ich_botschaft_statements.txt`).
2. Trainer-Prompt in `prompts/trainers/` anpassen.
3. Falls Pfade oder Übungen dazukommen, `exercises.json` aktualisieren.

## 10. Sprachausgabe (TTS) & Browser-Empfehlung

Die Anwendung nutzt die Web Speech API zur Vertonung der Dialoge.

- **Auto-Vorlesen**: Ein globaler Toggle in der Sidebar aktiviert die automatische Ausgabe neuer Nachrichten.
- **Natürliche Pausen**: Der Text wird vor der Ausgabe transformiert. Zeilenumbrüche und Doppelpunkte werden in Pausen umgewandelt, damit Überschriften und Listen natürlich klingen.
- **Rollen-Profile**: Der Mentor spricht etwas langsamer und gesetzter als die Dialogpartner.
- **Fix**: Eine 100ms Verzögerung verhindert das Verschlucken von Satzanfängen.

> [!IMPORTANT]
> **Browser-Empfehlung**: Für die beste Qualität wird **Microsoft Edge** empfohlen. Edge bietet Zugriff auf neuronale "Online (Natural)" Stimmen, die deutlich menschlicher klingen als die Standardstimmen anderer Browser.

---

_Hinweis: Ein Klick auf „Neustart“ setzt die Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

# Socio-Informatics Lab: Dialogue Training

## 1. Project at a Glance

The **Socio-Informatics Lab: Dialogue Training** is an interactive web application that bridges the gap between psychological communication techniques and modern AI. It provides users with a safe environment to practice challenging conversation scenarios or specifically refine their verbal expression.

### Core Features & Modes

The application offers two specialized training environments:

- **Interactive Simulations (Roleplay)**
  Immerse yourself in realistic dialogue scenarios. An AI counterpart reacts dynamically to your input, while an optional **AI Mentor** provides valuable behind-the-scenes feedback on your communication strategy.
- **Targeted Exercises (Transformation)**
  Focus on the technique. Practice transforming accusatory statements into constructive messages (e.g., I-messages or "Positive Assumptions"). The AI evaluates your attempts instantly and offers specific tips for improvement.

### User Experience Highlights

- **Natural Speech Flow:** Integrated **Text-to-Speech (TTS)** with optimized emphasis brings dialogues to life. (Pro tip: Microsoft Edge offers particularly human-like voices!)
- **Track Your Progress:** With the **Transcript Export** feature, you can save the entire conversation history—including the initial briefing—as a structured text file with a single click. Perfect for self-reflection or documenting learning milestones.

## 2. Technical Architecture

The application combines a static frontend with a server-side proxy (to protect the API key):

- **Frontend**: Static website (HTML5, Tailwind CSS, Vanilla JavaScript), e.g. hosted on **GitHub Pages**.
- **Backend proxy**: A small server-side script (e.g. PHP `chat.php`) running on any web server/hosting. This is required because API keys must never be exposed in client-side code.
- **Security (CORS)**: The proxy should only accept requests from the web app’s **origin** (e.g. `https://ryanaella.github.io`). Important: **origin = scheme + domain**, not the path (so not `.../dialogue_lab/`).
- **AI model**: OpenAI (configuration values from `config.js` are passed as parameters by `app.js` to the methods in `api.js`).

## 3. Repository File Structure

- `index.html`: UI / layout.
- `src/js/`:
  - `config.js`: Central runtime configuration (proxy URL, model, temperatures).
  - `utils.js`: Utility functions for text parsing, Markdown rendering, and role detection.
  - `api.js`: Manages communication with the proxy and loading/parsing of scenario and prompt files.
  - `ui.js`: Responsible for all DOM manipulations and visual rendering of the user interface.
  - `app.js`: Core application logic (state management, event handling, mode control) as a controller.
- `scenarios/`: Scenario and exercise files (`exercises.json` as central configuration, `*.txt` for scenario content).
- `prompts/`: Prompt files in `system/`, `partner/`, `mentor/`, `trainers/`.

Note: A server-side proxy script like `chat.php` does **not** have to live in this repository. Keeping it separate helps prevent accidental commits of secrets.

## 4. Scenarios and Modes

### 4.1 Exercise and Scenario Configuration (`exercises.json`)

The central configuration for all simulations and transformations is handled via `exercises.json`. This file defines the `id`, `type` (`SIMULATION` or `TRANSFORMATION`), and `config` for each exercise.

```json
[
  {
    "id": "ich_botschaften_basis",
    "type": "TRANSFORMATION",
    "config": {
      "sourceFile": "scenarios/transformations/ich_botschaft_statements.txt",
      "instructionFile": "scenarios/transformations/ich_botschaft_instructions.txt"
    }
  },
  {
    "id": "simulation_reporting",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/reporting_scenario.txt"
    }
  }
]
```

- `sourceFile`: For `TRANSFORMATION` exercises, contains the list of statements (one per line).
- `instructionFile`: For `TRANSFORMATION` exercises, contains the briefing and the `trainer_prompt` reference in the META block.
- `scenarioFile`: For `SIMULATION` exercises, contains the briefing and all prompt references in the META block.

### 4.2 Dialogue Scenario Format (`*.txt`)

#### The META Block

The fields within the `META` block are now strictly categorized by exercise type to ensure consistency. The `title` is mandatory for all modes.

**Option A: Simulations (Dialogue Training)**
Used when the type is set to `SIMULATION` in `exercises.json`.

```text
### META ###
title: Feedback Meeting: Late Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

- `system_prompt`, `partner_prompt`, `mentor_prompt`: References to the respective `.txt` files in the `prompts/` subdirectories.

**Option B: Transformations (Exercise Mode)**
Used when the type is set to `TRANSFORMATION` in `exercises.json`.

```text
### META ###
title: Positive Assumption
trainer_prompt: positive_assumption_trainer
short_instruction: Identify the positive I- and You-messages
```

- `trainer_prompt`: Reference to the file in the `prompts/trainers/` folder.
- `short_instruction`: A concise task instruction displayed in the UI directly above the input area.

#### The GUI Instruction

Everything after `### GUI INSTRUCTION ###` is shown as the briefing. If `role_label` is not set, the app tries to detect the role heuristically from the text to customize chat labels and placeholders.

#### Runtime Validation

When loading a scenario, the app validates that:

- the `### GUI INSTRUCTION ###` marker is present
- **Simulation**: Validates presence of `system_prompt`, `partner_prompt`, and `mentor_prompt`.
- **Transformation**: Validates presence of `trainer_prompt` and `short_instruction`.
- the GUI instruction is not empty

If any of these checks fail, the app shows a clear error message in status/briefing instead of continuing with incomplete data.

### 4.3 Exercise Mode (Transformations)

The exercise mode (formerly I-Message Mode) is configured via `exercises.json`. It uses transformation scenarios to train specific techniques.

- `sourceFile` (e.g., `scenarios/transformations/ich_botschaft_statements.txt`): Contains the list of statements (one per line).
- `instructionFile` (e.g., `scenarios/transformations/ich_botschaft_instructions.txt`): Contains the briefing and the `trainer_prompt` reference in the META block.

UI behavior in Exercise mode:

- Scenario selection is hidden
- A mode badge shows the active mode
- Messages are visually separated (`Task` vs. `Feedback`)
- Exercise actions are available directly below the chat input:
  - `Revise`
  - `Next statement`
  - `Restart exercise`

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
  - **Note for local development**: For testing from `localhost`, `http://localhost` (and potentially a specific port, e.g., `http://localhost:5500`) must also be allowed in the `Access-Control-Allow-Origin` headers of the proxy script on the server. This should be removed for production.

### 6.3 Reference Implementation (`chat.php`)

The script should be placed on the server (e.g., at `/var/www/html/dialogue_lab/chat.php`). See the German section for the code template.

## 7. Deployment (Example: GitHub Pages + your proxy)

1. **Frontend**: Push the repository. The GitHub Actions workflow (`deploy.yml`) handles deployment automatically.
2. **Proxy**: Deploy the proxy script to your web server (HTTPS recommended).
3. **Frontend configuration**: Adjust the `PROXY_URL` in `src/js/config.js` to match the actual deployment path on your server (e.g., `https://kite2.site/dialogue_lab/chat.php`).

### 7.1 Multi-Branch Deployment

The application uses a dynamic deployment model. Every push to a branch triggers a deployment:

- **Main Branch**: Accessible at the root URL (e.g., `https://ryanaella.github.io/dialogue_lab/`).
- **Other Branches**: Accessible in subdirectories (e.g., `https://ryanaella.github.io/dialogue_lab/exercises-only/`).
  This allows providing specialized versions for partners or testing in parallel without affecting the main version.

### 7.2 Frontend Configuration

Runtime values (model, temperatures, proxy URL) are maintained in `src/js/config.js`. The `app.js` orchestrates the data flow by reading these values and passing them to the stateless functions in `api.js` as needed.

## 8. How to Add a New Dialogue Scenario

1. Create prompt files as `.txt`:
   - `prompts/system/<name>.txt`
   - `prompts/partner/<name>.txt`
   - `prompts/mentor/<name>.txt` (optional, if mentor feedback is used)
   - `prompts/trainers/<name>.txt` (for exercises / transformations)
2. Create a new scenario file in `scenarios/simulations/` using the `### META ###` and `### GUI INSTRUCTION ###` format.
3. Add an entry to `exercises.json`.
4. Deploy — the scenario will appear in the dropdown.

## 9. Maintaining I-Message Content

1. Edit statements in the respective `sourceFile` (e.g., `scenarios/transformations/ich_botschaft_statements.txt`).
2. Adjust the trainer prompt in `prompts/trainers/`.
3. If paths or exercises are added, update `exercises.json`.

## 10. Text-to-Speech (TTS) & Browser Recommendation

The application uses the Web Speech API for voice output.

- **Auto-Speak**: A global toggle in the sidebar enables automatic reading of new messages.
- **Natural Pauses**: Text is transformed before output. Line breaks and colons are converted into pauses for natural-sounding headings and lists.
- **Role Profiles**: The mentor speaks slightly slower and more deliberately than dialogue partners.
- **Fix**: A 100ms delay prevents the clipping of the start of sentences.

> [!IMPORTANT]
> **Browser Recommendation**: For the best quality, **Microsoft Edge** is recommended. Edge provides access to neural "Online (Natural)" voices that sound significantly more human than the standard voices of other browsers.

---

## _Note: Clicking "Restart" resets the application and clears the current chat history from the browser's memory._
