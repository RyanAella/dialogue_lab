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

- **Barrierefreie Eingabe:** Über das Mikrofon-Symbol können Antworten direkt eingesprochen werden (**Speech-to-Text**). Hinweis: Diese Funktion nutzt die native Web Speech API und wird aktuell von Chrome und Edge unterstützt (in Firefox technisch bedingt deaktiviert).
- **Natürliches Sprachgefühl:** Dank integrierter **Sprachausgabe (TTS)** mit optimierter Betonung und automatischen Pausen bei Satzzeichen werden die Dialoge lebendig. Ein globaler **Stop-Button** in der Sidebar erlaubt es, die Ausgabe jederzeit sofort abzubrechen. (Tipp: In Microsoft Edge klingen die Stimmen besonders menschlich!)
- **Fortschritt sichern:** Über den **Protokoll-Export** lässt sich der gesamte Gesprächsverlauf inklusive des ursprünglichen Briefings mit einem Klick als strukturierte Textdatei (`[Modus]_[Titel]_[Datum].txt`) speichern – ideal für die Nachbereitung oder zur Dokumentation von Lernfortschritten.
- **Abwechslungsreiches Training:** Die Übungen im Transformations-Modus werden bei jedem Start automatisch zufällig angeordnet, um den Lerneffekt zu steigern und Wiederholungen interessanter zu gestalten.

## 2. Technische Architektur

Die Anwendung kombiniert ein statisches Frontend mit einem serverseitigen Proxy (für API-Key-Schutz):

- **Frontend**: Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript), z.B. gehostet auf **GitHub Pages**.
- **Backend-Proxy**: Ein kleines serverseitiges Skript (z.B. PHP `chat.php`) auf einem beliebigen Webserver/Hosting. Das ist notwendig, da API-Keys niemals im Client-Code (JavaScript) stehen dürfen.
- **Sicherheit (CORS)**: Der Proxy sollte nur Anfragen vom **Origin** akzeptieren, auf dem die Web-App läuft (z.B. `https://ryanaella.github.io`). Wichtig: **Origin = Schema + Domain**, nicht der Pfad (also nicht `.../dialogue_lab/`).
- **Schnittstellen:** Nutzt die native **Web Speech API** für Audio-Ein- und Ausgabe (lokale/Browser-seitige Verarbeitung).
- **KI-Modell**: OpenAI (Konfigurationswerte aus `config.js` werden von der `app.js` als Parameter an die Methoden der `api.js` übergeben).

## 3. Repository-Dateistruktur

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Zentrale Runtime-Konfiguration (Proxy-URL, Modell, Temperaturen).
  - `utils.js`: Hilfsfunktionen für Text-Parsing, Markdown-Rendering und Rollen-Erkennung.
  - `api.js`: Verwaltet die Kommunikation mit dem Proxy und das Laden/Parsen von Szenario- und Prompt-Dateien.
  - `ui.js`: Zuständig für alle DOM-Manipulationen und die visuelle Darstellung der Benutzeroberfläche.
  - `app.js`: Zentrale Anwendungslogik (State-Management, Event-Handling, Modus-Steuerung) als Controller.
- `src/data/`: `exercises.json` als zentrale Konfiguration.
- `scenarios/`: Szenariodateien.
- `prompts/`: Prompt-Dateien in Unterordnern `system/`, `partner/`, `mentor/`, `trainers/`.

Hinweis: Ein serverseitiges Proxy-Skript wie `chat.php` ist **nicht zwingend Teil dieses Repositories**. Es kann getrennt auf dem Server liegen, damit keine Secrets im Repo landen.

## 4. Szenarien und Konfiguration

### 4.1 Die `exercises.json`

Diese Datei steuert alle verfügbaren Inhalte und unterscheidet zwischen den Typen `SIMULATION` und `TRANSFORMATION`.

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

### 4.2 Szenarioformat (`*.txt`)

Jedes Szenario besteht aus einem **META-Block** und der **GUI Instruction**.

**Variante A: Simulationen (Gesprächstraining)**

```text
### META ###
title: Kritikgespräch: Verspätetes Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

**Variante B: Transformationen (Übungs-Modus)**

```text
### META ###
title: Ich-Botschaften Basis
trainer_prompt: ich_botschaft_trainer
short_instruction: Formuliere den Vorwurf in eine Ich-Botschaft um.
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

## 7. Neues Szenario hinzufügen

1. Prompt-Dateien (`.txt`) in den entsprechenden `prompts/`-Unterordnern erstellen.
2. Szenario-Datei in `scenarios/` anlegen (inkl. META-Block und GUI Instruction).
3. Neuen Eintrag in `exercises.json` hinzufügen.

## 8. Inhalte pflegen

1. Szenario-Dateien unter `scenarios/` bearbeiten (Inhalt und GUI Instruction).
2. Prompt-Dateien in `prompts/` anpassen.
3. Falls neue Szenarien hinzugefügt werden, `exercises.json` aktualisieren.

---

_Hinweis: Ein Klick auf „Neustart“ setzt die Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

# Socio-Informatics Lab: Conversation Training

## 1. Project at a Glance

The **Socio-Informatics Lab: Conversation Training** is an interactive web application that bridges the gap between psychological counseling techniques and modern AI. It provides users with a safe space to practice difficult conversation scenarios or specifically refine their communication style.

### Core Functions & Modes

The application offers two specialized training environments:

- **Interactive Simulations (Roleplay):** Dive into realistic conversation scenarios. An AI counterpart reacts dynamically to your input, while an optional **AI Mentor** provides valuable background feedback on your strategy.
- **Targeted Exercises (Transformation):** This mode focuses on technique. Practice rephrasing accusations into constructive messages (e.g., "I-statements" or positive assumptions). The AI evaluates your attempts immediately and provides tips for improvement.

### User Experience Highlights

- **Accessible Input:** Responses can be spoken directly using the microphone icon (**Speech-to-Text**). Note: This feature uses the browser's native Web Speech API and is currently supported by Chrome and Edge (disabled in Firefox due to missing browser support).
- **Natural Speech Feel:** Thanks to integrated **Text-to-Speech (TTS)** with optimized emphasis and automatic pauses at punctuation marks, dialogues come to life. A global **Stop Button** in the sidebar allows you to cancel the output immediately at any time. (Pro tip: Voices sound particularly human in Microsoft Edge!)
- **Save Your Progress:** The **Protocol Export** allows you to save the entire conversation history, including the original briefing, as a structured text file (`[Mode]_[Title]_[Date].txt`) with one click—ideal for review or documenting learning progress.
- **Varied Training:** Exercises in transformation mode are automatically randomized upon every start to enhance the learning effect and keep repetitions engaging.

## 2. Technical Architecture

The application combines a static frontend with a server-side proxy (for API key protection):

- **Frontend:** Static website (HTML5, Tailwind CSS, Vanilla JavaScript), e.g., hosted on **GitHub Pages**.
- **Backend Proxy:** A small server-side script (e.g., PHP `chat.php`) on any web server/hosting. This is necessary because API keys must never be exposed in client-side code (JavaScript).
- **Security (CORS):** The proxy should only accept requests from the **Origin** where the web app is running (e.g., `https://ryanaella.github.io`). Important: **Origin = Scheme + Domain**, not the path (i.e., not `.../dialogue_lab/`).
- **Interfaces:** Uses the native **Web Speech API** for audio input and output (local/browser-side processing).
- **AI Model:** OpenAI (configuration values from `config.js` are passed as parameters by `app.js` to the methods in `api.js`).

## 3. Repository File Structure

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Central runtime configuration (Proxy URL, model, temperatures).
  - `utils.js`: Helper functions for text parsing, Markdown rendering, and role detection.
  - `api.js`: Manages communication with the proxy and handles loading/parsing of scenario and prompt files.
  - `ui.js`: Responsible for all DOM manipulations and the visual representation of the user interface.
  - `app.js`: Central application logic (state management, event handling, mode control) acting as the controller.
- `src/data/`: `exercises.json` as central configuration.
- `scenarios/`: Scenario files.
- `prompts/`: Prompt files in subfolders `system/`, `partner/`, `mentor/`, `trainers/`.

> **Note:** A server-side proxy script like `chat.php` is **not necessarily part of this repository**. It can be stored separately on the server to ensure no secrets are committed to the repo.

## 4. Scenarios and Configuration

### 4.1 The `exercises.json`

This file controls all available content and distinguishes between the types `SIMULATION` and `TRANSFORMATION`.

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

### 4.2 Scenario Format (`*.txt`)

Each scenario consists of a **META block** and the **GUI Instruction**.

**Variant A: Simulations (Conversation Training)**

```text
### META ###
title: Performance Review: Delayed Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

**Variant B: Transformations (Exercise Mode)**

```text
### META ###
title: I-Statements Basics
trainer_prompt: i_statement_trainer
short_instruction: Rephrase the accusation into an I-statement.
```

## 5. Proxy Setup & Security

Communication is handled via a PHP proxy to keep the API key secure.

### 5.1 API Key & CORS

- Store the key exclusively **server-side** within the proxy script.
- The proxy should strictly limit the `Access-Control-Allow-Origin` headers to your specific domain.

### 5.2 Reference Implementation (`chat.php`)

The script receives the payload from the frontend, adds the Authorization header, and forwards the request to OpenAI. (A template is located in the documentation folder).

## 6. Deployment & Configuration

1.  **Frontend:** Host the repository on GitHub Pages.
2.  **Proxy:** Place `chat.php` on a web server with HTTPS support.
3.  **Configuration:** Update the `PROXY_URL` in `src/js/config.js` to the path of your proxy script.

### Multi-Branch Deployment

Every push to a branch triggers an automated deployment:

- **Main Branch:** Main version under the root URL.

## 7. Adding a New Scenario

1.  Create prompt files (`.txt`) in the corresponding `prompts/` subfolders.
2.  Create a scenario file in `scenarios/` (including the META block and GUI Instruction).
3.  Add a new entry to `exercises.json`.

## 8. Content Maintenance

1.  Edit scenario files under `scenarios/` (content and GUI Instruction).
2.  Adjust prompt files in `prompts/`.
3.  If new scenarios are added, update `exercises.json`.

---

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's volatile memory._
