# Lab für Sozioinformatik: Gesprächstraining (Simulation Lab)

> [!IMPORTANT]
> **Edition-Hinweis:** Dies ist eine spezialisierte Version der Anwendung. Im Gegensatz zur Hauptversion konzentriert sich dieser Stand ausschließlich auf **Dialogsimulationen** (Rollenspiele) und enthält keinen Übungs-Modus für isolierte Transformationen.

## 1. Das Projekt auf einen Blick

Das **Lab für Sozioinformatik: Simulation Lab** ist eine interaktive Web-Anwendung, die die Brücke zwischen psychologischer Gesprächsführung und moderner KI schlägt. Nutzer können hier in einem geschützten Raum komplexe Gesprächssituationen trainieren und direktes Feedback erhalten.

### Kernfunktionen dieser Edition

- **Interaktive Simulationen (Rollenspiel):** Tauche in realistische Szenarien ein. Ein KI-Gegenüber reagiert dynamisch auf deine Eingaben, während ein optionaler **KI-Mentor** im Hintergrund wertvolles Feedback zu deiner Strategie gibt.
- **Dynamisches Avatar-System:** Ein Multi-Layer Rendering-System (PNG/SVG) sorgt für visuelle Vielfalt. Avatare verfügen über automatisches Blinken, Lippensynchronität beim Sprechen und zufällige Trait-Zuweisung (Haare, Kleidung, Accessoires).
- **Barrierefreie Eingabe:** Über das Mikrofon-Symbol können Antworten direkt eingesprochen werden (**Speech-to-Text**). Hinweis: Diese Funktion nutzt die native Web Speech API und wird aktuell von Chrome und Edge unterstützt (in Firefox technisch bedingt deaktiviert).
- **Natürliches Sprachgefühl:** Integrierte **Sprachausgabe (TTS)** mit kontextabhängiger Geschwindigkeit und Pitch-Modulation erzeugt lebendige Dialoge. Optimiert für Microsoft Edge (Neural Voices).
- **Fortschritt sichern:** Über den **Protokoll-Export** lässt sich der gesamte Gesprächsverlauf inklusive Briefing mit einem Klick als strukturierte Textdatei speichern – ideal für die Nachbereitung.

## 2. Technische Architektur

Das Projekt folgt einem modernen, service-orientierten JavaScript-Ansatz (ES6 Module) mit einem serverseitigen Proxy zum Schutz der API-Keys:

- **Frontend:** Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript).
- **Backend-Proxy:** Ein serverseitiges Skript (z.B. PHP `chat.php`), das die API-Keys kapselt.
- **Sicherheit (CORS):** Der Proxy akzeptiert nur Anfragen vom definierten **Origin** der Web-App (z.B. `https://ryanaella.github.io`).
- **KI-Modell:** OpenAI (Konfigurationswerte werden zentral in der `src/js/core/config.js` verwaltet).

## 3. Repository-Dateistruktur

### Kern-Module (`src/js/`)

Die Codebasis ist modular nach Verantwortungsbereichen organisiert:

| Ordner       | Verantwortung                          | Enthaltene Module                     |
|--------------|-----------------------------------------|---------------------------------------|
| **`core/`**  | **Controller**: Application Foundation | `app.js`, `config.js`                 |
| **`features/`** | **Domain Logic** | `avatar.js` (Visuals), `chat.js` (State-Manager), `profiles.js` (Assets), `scenario.js` (Data-Service), `speech.js` (Audio-Service) |
| **`services/`** | **Network** | `api.js` (API-Anfragen & Caching) |
| **`ui/`**    | **View-Manager** | `ui.js` (DOM-Elemente & Rendering) |
| **`utils/`** | **Helpers** | `utils.js` (Markdown-Parsing & Text-Bereinigung) |

### Daten & Inhalte

- `src/data/exercises.json`: Der zentrale Katalog aller verfügbaren Simulationen.
- `scenarios/`: Markdown-ähnliche Szenario-Beschreibungen und GUI-Instruktionen.
- `prompts/`: Unterordner für KI-Prompts (`system/`, `partner/`, `mentor/`).

## 4. Szenarien und Konfiguration

Dieser Abschnitt beschreibt, wie die Inhalte für die Simulationen strukturiert und konfiguriert werden. Die App trennt strikt zwischen Code und Inhalt, um eine einfache Wartung und Erweiterung zu ermöglichen.

### 4.1 Die `exercises.json`

Diese Datei (`src/data/exercises.json`) steuert, welche Simulationen in der App zur Verfügung stehen. Jedes Objekt repräsentiert eine Übung.

```json
[
  {
    "id": "simulation_reporting",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/reporting_scenario.txt"
    }
  },
  {
    "id": "simulation_difficulties",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/difficulties_scenario.txt"
    }
  }
]
```

### 4.2 Szenarioformat & Prompt-Mapping (`*.txt`)

Jedes Szenario besteht aus einem **META-Block** (Referenzierung der Prompts) und der **GUI Instruction** (Briefing für den Nutzer).

```text
### META ###
title: Kritikgespräch: Verspätetes Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt

### GUI INSTRUCTION ###
Hier folgt das Briefing, das dem Nutzer vor dem Start angezeigt wird...
```

## 5. Proxy-Setup & Sicherheit

Die Kommunikation erfolgt über einen PHP-Proxy, um den API-Key sicher zu verwahren.

### 5.1 API-Key & CORS

- Hinterlege den Key ausschließlich **serverseitig** im Proxy-Skript.
- Der Proxy sollte die `Access-Control-Allow-Origin` Header strikt auf deine Domain einschränken.

### 5.2 Referenz-Implementierung (`chat.php`)

Das Skript empfängt den Payload vom Frontend, fügt den Authorization-Header hinzu und leitet die Anfrage an OpenAI weiter. (Eine Vorlage befindet sich im Dokumentations-Ordner).

## 6. Deployment & Konfiguration

1. **Frontend:** Repository auf GitHub Pages hosten.
2. **Proxy:** `chat.php` auf einem Webserver mit HTTPS-Support ablegen.
3. **Konfiguration:** Die `PROXY_URL` in `src/js/core/config.js` an den Pfad deines Proxy-Skripts anpassen.
4. **Wichtig für GitHub Pages:** Da GitHub Pages auf Linux-Servern läuft, ist das Dateisystem **case-sensitive**. Achte strikt darauf, dass Dateinamen im Code exakt so geschrieben werden wie im Dateisystem. Vermeide Leerzeichen in Dateinamen (nutze stattdessen `snake_case`).

### Multi-Branch Deployment

Jeder Push auf einen Branch löst ein automatisches Deployment aus:

- **Main-Branch:** Hauptversion unter der Root-URL.
- **Simulation-Branch:** Spezialversion unter `/simulation-lab/`.

## 7. Neues Szenario hinzufügen

1. **Prompts erstellen:** Drei Dateien in `prompts/system/`, `prompts/partner/` und `prompts/mentor/` anlegen.
2. **Szenario-File:** Eine `.txt`-Datei in `scenarios/simulations/` erstellen. Im `### META ###`-Block auf die neuen Prompt-Dateinamen verweisen (ohne Endung).
3. **Pool erweitern:** Die neue ID und den Pfad in `src/data/exercises.json` registrieren.
4. **Avatar-Mapping:** Sicherstellen, dass der `role_label` in der META-Sektion einem Key in `profiles.js` entspricht, um den korrekten Charakter-Pool zu laden.

## 8. Inhalte pflegen

### Best Practices für Prompts

- **Vermeide Meta-Talk:** Die KI-Partner sollten nie über "Phasen" oder "Prompts" sprechen, sondern immer in der Rolle bleiben.
- **Einwand-Rotation:** Hinterlege im Partner-Prompt eine Liste mit 4-5 Einwänden, damit Gespräche variieren.
- **Strukturierte Mentor-Ausgabe:** Nutze im Mentor-Prompt klare Trenner (z.B. `---`), damit die `utils.js` das Feedback sauber im Modal darstellen kann.

### Grafiken & Assets

Neue Avatare müssen im Ordner `src/assets/Character/` abgelegt werden. Achte auf das Suffix für Hauttöne (z.B. `head_v1_a.png` bis `head_v1_d.png`), damit das automatische Matching der Hände funktioniert.

---

_Hinweis: Ein Klick auf „Neustart“ setzt die Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

# Socio-Informatics Lab: Simulation Lab (English)

> [!IMPORTANT]
> **Edition Note:** This is a specialized version of the application. Unlike the main version, this build focuses exclusively on **Dialogue Simulations** (roleplays) and does not include the exercise mode for isolated sentence transformations.

## 1. Project at a Glance

The **Socio-Informatics Lab: Simulation Lab** is an interactive web application that bridges the gap between psychological communication techniques and modern AI. Users can practice complex conversation scenarios in a safe environment and receive direct feedback.

### Core Features of this Edition

- **Interactive Simulations (Roleplay):** Immerse yourself in realistic scenarios. An AI counterpart reacts dynamically to your input, while an optional **AI Mentor** provides valuable background feedback on your strategy.
- **Dynamic Avatar System:** A multi-layer rendering system (PNG/SVG) provides visual variety. Avatars feature automatic blinking, lip-syncing during speech, and randomized trait assignment (hair, clothes, accessories).
- **Accessible Input:** Responses can be spoken directly using the microphone icon (**Speech-to-Text**). Note: This feature uses the browser's native Web Speech API and is currently supported by Chrome and Edge (disabled in Firefox due to missing browser support).
- **Natural Speech Flow:** Integrated **Text-to-Speech (TTS)** with context-aware rate and pitch modulation creates lifelike dialogues. Optimized for Microsoft Edge (Neural Voices).
- **Track Your Progress:** Use the **Transcript Export** feature to save the entire conversation history, including the briefing, as a structured text file with a single click—perfect for self-reflection.

## 2. Technical Architecture

The project follows a modern, service-oriented JavaScript approach (ES6 Modules) combined with a server-side proxy to protect API keys:

- **Frontend:** Static website (HTML5, Tailwind CSS, Vanilla JavaScript).
- **Backend Proxy:** A small server-side script (e.g., PHP `chat.php`) that encapsulates the API keys.
- **Security (CORS):** The proxy only accepts requests from the defined **Origin** of the web app (e.g., `https://ryanaella.github.io`).
- **AI Model:** OpenAI (configuration values are managed centrally in `src/js/core/config.js`).

## 3. Repository File Structure

### Core Modules (`src/js/`)

The codebase is organized modularly by responsibility:

| Folder        | Responsibility                          | Contained Modules                     |
|---------------|-----------------------------------------|---------------------------------------|
| **`core/`**   | **Controller**: Application Foundation | `app.js`, `config.js`                 |
| **`features/`** | **Domain Logic** | `avatar.js` (Visuals), `chat.js` (State-Manager), `profiles.js` (Assets), `scenario.js` (Data-Service), `speech.js` (Audio-Service) |
| **`services/`** | **Network** | `api.js` (API requests & Caching) |
| **`ui/`**     | **View-Manager** | `ui.js` (DOM elements & Rendering) |
| **`utils/`**  | **Helpers** | `utils.js` (Markdown parsing & Text cleaning) |

### Data & Content

- `src/data/exercises.json`: The central catalog of all available simulations.
- `scenarios/`: Markdown-like scenario descriptions and GUI instructions.
- `prompts/`: Subfolders for AI prompts (`system/`, `partner/`, `mentor/`).

## 4. Scenarios and Configuration

This section describes how the content for the simulations is structured and configured. The app strictly separates code from content to facilitate easy maintenance and expansion.

### 4.1 The `exercises.json`

This file (`src/data/exercises.json`) controls which simulations are available in the app. Each object represents an exercise.

```json
[
  {
    "id": "simulation_reporting",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/reporting_scenario.txt"
    }
  },
  {
    "id": "simulation_difficulties",
    "type": "SIMULATION",
    "config": {
      "scenarioFile": "scenarios/simulations/difficulties_scenario.txt"
    }
  }
]
```

### 4.2 Scenario Format & Prompt Mapping (`*.txt`)

Each scenario consists of a **META block** (referencing the prompts) and the **GUI Instruction** (briefing for the user).

```text
### META ###
title: Feedback Meeting: Delayed Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt

### GUI INSTRUCTION ###
Here follows the briefing shown to the user before starting...
```

## 5. Proxy Setup & Security

Communication is handled via a PHP proxy to keep the API key secure.

### 5.1 API Key & CORS

- Store the key **server-side only** within the proxy script.
- The proxy should strictly limit the `Access-Control-Allow-Origin` headers to your domain.

### 5.2 Reference Implementation (`chat.php`)

The script receives the payload from the frontend, adds the Authorization header, and forwards the request to OpenAI. (A template is provided in the documentation folder).

## 6. Deployment & Configuration

1. **Frontend:** Host the repository on GitHub Pages.
2. **Proxy:** Upload `chat.php` to a web server with HTTPS support.
3. **Configuration:** Adjust the `PROXY_URL` in `src/js/core/config.js` to point to the actual path of your proxy script.
4. **Important for GitHub Pages:** Since GitHub Pages runs on Linux servers, the file system is **case-sensitive**. Ensure that filenames in the code match the filesystem exactly. Avoid spaces in filenames (use `snake_case` instead).

### Multi-Branch Deployment

Every push to a branch triggers an automatic deployment:

- **Main Branch:** Main version at the root URL.
- **Simulation Branch:** Specialized version at `/simulation-lab/`.

## 7. Adding a New Scenario

1. **Create Prompts:** Add three files to `prompts/system/`, `prompts/partner/`, and `prompts/mentor/`.
2. **Scenario File:** Create a `.txt` file in `scenarios/simulations/`. Reference the new prompt filenames in the `### META ###` block (without extensions).
3. **Register Exercise:** Add the new ID and path to `src/data/exercises.json`.
4. **Avatar Mapping:** Ensure the `role_label` in the META section matches a key in `profiles.js` to load the correct character pool.

## 8. Maintaining Content

### Best Practices for Prompts

- **Avoid Meta-Talk:** AI partners should never discuss "phases" or "prompts"; they must remain in character.
- **Objection Rotation:** Include a list of 4-5 objections in the partner prompt to ensure variety across sessions.
- **Structured Mentor Output:** Use clear separators (e.g., `---`) in the mentor prompt so `utils.js` can render the feedback cleanly in the modal.

### Graphics & Assets

Place new avatars in the `src/assets/Character/` folder. Use skin tone suffixes (e.g., `head_v1_a.png` to `head_v1_d.png`) to enable automatic hand graphic matching.

---

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's memory._
