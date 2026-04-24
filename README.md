> [!IMPORTANT]
> **Edition-Hinweis:** Dies ist eine spezialisierte Version der Anwendung. Im Gegensatz zur Hauptversion konzentriert sich dieser Stand ausschließlich auf **Dialogsimulationen** (Rollenspiele) und enthält keinen Übungs-Modus für isolierte Transformationen.

## 1. Das Projekt auf einen Blick

Das **Lab für Sozioinformatik: Simulation Lab** ist eine interaktive Web-Anwendung, die die Brücke zwischen psychologischer Gesprächsführung und moderner KI schlägt. Nutzer können hier in einem geschützten Raum komplexe Gesprächssituationen trainieren und direktes Feedback erhalten.

### Kernfunktionen dieser Edition

- **Interaktive Simulationen (Rollenspiel):** Tauche in realistische Szenarien ein. Ein KI-Gegenüber reagiert dynamisch auf deine Eingaben, während ein optionaler **KI-Mentor** im Hintergrund wertvolles Feedback zu deiner Strategie gibt.
- **Natürliches Sprachgefühl:** Dank integrierter **Sprachausgabe (TTS)** mit optimierter Betonung werden die Dialoge lebendig. (Tipp: In Microsoft Edge klingen die Stimmen besonders menschlich!)
- **Fortschritt sichern:** Über den **Protokoll-Export** lässt sich der gesamte Gesprächsverlauf inklusive Briefing mit einem Klick als strukturierte Textdatei speichern – ideal für die Nachbereitung.

## 2. Technische Architektur

Die Anwendung nutzt ein statisches Frontend mit einem serverseitigen Proxy zum Schutz der API-Keys:

- **Frontend:** Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript).
- **Backend-Proxy:** Ein serverseitiges Skript (z.B. PHP `chat.php`), das die API-Keys kapselt.
- **Sicherheit (CORS):** Der Proxy akzeptiert nur Anfragen vom definierten **Origin** der Web-App (z.B. `https://ryanaella.github.io`).
- **KI-Modell:** OpenAI (Konfigurationswerte werden zentral in der `config.js` verwaltet).

## 3. Repository-Dateistruktur

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Zentrale Runtime-Konfiguration (Proxy-URL, Modell, Temperaturen).
  - `utils.js`: Hilfsfunktionen für Text-Parsing, Markdown und Rollen-Erkennung.
  - `api.js`: Kommunikation mit dem Proxy und Laden der Szenarien/Prompts.
  - `ui.js`: DOM-Manipulationen und visuelle Darstellung.
  - `app.js`: Zentrale Anwendungslogik und State-Management.
- `scenarios/`: Enthält die `exercises.json` (Konfiguration) und die Szenario-Inhalte (`*.txt`).
- `prompts/`: Unterordner für `system/`, `partner/` und `mentor/`.

## 4. Szenarien und Konfiguration

### 4.1 Die `exercises.json`

Diese Datei steuert, welche Simulationen in der App zur Verfügung stehen.

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

### 4.2 Szenarioformat (`*.txt`)

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
3. **Konfiguration:** Die `PROXY_URL` in `src/js/config.js` an den Pfad deines Proxy-Skripts anpassen.

### Multi-Branch Deployment

Jeder Push auf einen Branch löst ein automatisches Deployment aus:

- **Main-Branch:** Hauptversion unter der Root-URL.
- **Simulation-Branch:** Spezialversion unter `/simulation-lab/`.

## 7. Neues Szenario hinzufügen

1. Erstelle die Prompt-Dateien (`system`, `partner`, `mentor`) unter `prompts/`.
2. Erstelle eine neue Szenario-Datei unter `scenarios/simulations/`.
3. Trage die neue ID und den Pfad in die `exercises.json` ein.

## 8. Inhalte pflegen

1. Szenario-Dateien unter `scenarios/simulations/` bearbeiten (Inhalt und GUI Instruction).
2. Prompt-Dateien in `prompts/` (system, partner, mentor) anpassen.
3. Falls neue Szenarien hinzugefügt werden, `exercises.json` aktualisieren.

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
- **Natural Speech Flow:** Integrated **Text-to-Speech (TTS)** with optimized prosody brings dialogues to life. (Tip: Microsoft Edge offers particularly human-like voices!)
- **Track Your Progress:** Use the **Transcript Export** feature to save the entire conversation history, including the briefing, as a structured text file with a single click—perfect for self-reflection.

## 2. Technical Architecture

The application uses a static frontend combined with a server-side proxy to protect API keys:

- **Frontend:** Static website (HTML5, Tailwind CSS, Vanilla JavaScript).
- **Backend Proxy:** A small server-side script (e.g., PHP `chat.php`) that encapsulates the API keys.
- **Security (CORS):** The proxy only accepts requests from the defined **Origin** of the web app (e.g., `https://ryanaella.github.io`).
- **AI Model:** OpenAI (configuration values are managed centrally in `src/js/config.js`).

## 3. Repository File Structure

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Central runtime configuration (proxy URL, model, temperatures).
  - `utils.js`: Utility functions for text parsing, Markdown, and role detection.
  - `api.js`: Handles communication with the proxy and loading of scenarios/prompts.
  - `ui.js`: DOM manipulation and visual rendering.
  - `app.js`: Core application logic and state management.
- `scenarios/`: Contains `exercises.json` (configuration) and scenario content (`*.txt`).
- `prompts/`: Subfolders for `system/`, `partner/`, and `mentor/`.

## 4. Scenarios and Configuration

### 4.1 The `exercises.json`

This file controls which simulations are available within the app.

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

### 4.2 Scenario Format (`*.txt`)

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
3. **Configuration:** Adjust the `PROXY_URL` in `src/js/config.js` to point to the actual path of your proxy script.

### Multi-Branch Deployment

Every push to a branch triggers an automatic deployment:

- **Main Branch:** Main version at the root URL.
- **Simulation Branch:** Specialized version at `/simulation-lab/`.

## 7. Adding a New Scenario

1. Create the prompt files (`system`, `partner`, `mentor`) in the `prompts/` directory.
2. Create a new scenario file in `scenarios/simulations/`.
3. Add the new ID and path to the `exercises.json` file.

## 8. Maintaining Content

1. Edit scenario files in `scenarios/simulations/` (content and GUI instructions).
2. Adjust prompt files in `prompts/` (system, partner, mentor).
3. Update `exercises.json` whenever new scenarios are added.

---

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's memory._
