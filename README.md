> [!IMPORTANT]
> **Edition-Hinweis:** Dies ist eine spezialisierte Version der Anwendung. Im Gegensatz zur Hauptversion konzentriert sich dieser Stand ausschließlich auf **Transformations-Übungen** (interaktive Umformulierungen) und enthält keinen Simulations-Modus.

# Lab für Sozioinformatik: Transformation Lab

## 1. Das Projekt auf einen Blick

Das **Lab für Sozioinformatik: Transformation Lab** ist eine interaktive Web-Anwendung, die die Brücke zwischen psychologischer Gesprächsführung und moderner KI schlägt. Nutzer können hier in einem geschützten Raum gezielt an ihrer Ausdrucksweise arbeiten.

### Kernfunktionen dieser Edition

- **Gezielte Übungen (Transformation)**
  Hier liegt der Fokus auf der Technik. Trainiere das Umformulieren von Vorwürfen in konstruktive Botschaften (z. B. Ich-Botschaften oder Positive Unterstellungen). Die KI bewertet deine Versuche sofort und gibt Tipps zur Verbesserung.
- **Natürliches Sprachgefühl:** Dank integrierter **Sprachausgabe (TTS)** mit optimierter Betonung werden die Dialoge lebendig. (Tipp: In Microsoft Edge klingen die Stimmen besonders menschlich!)
- **Abwechslungsreiches Training:** Die Übungssituationen werden bei jedem Start automatisch zufällig angeordnet, um den Lerneffekt zu steigern und Wiederholungen interessanter zu gestalten.
- **Barrierefreie Eingabe:** Über das Mikrofon-Symbol können Antworten direkt eingesprochen werden (**Speech-to-Text**). Hinweis: Diese Funktion nutzt die native Web Speech API und wird aktuell von Chrome und Edge unterstützt (in Firefox technisch bedingt deaktiviert).
- **Fortschritt sichern:** Über den **Protokoll-Export** lässt sich der gesamte Gesprächsverlauf inklusive Briefing mit einem Klick als strukturierte Textdatei speichern – ideal für die Nachbereitung.

## 2. Technische Architektur

Die Anwendung nutzt ein statisches Frontend mit einem serverseitigen Proxy zum Schutz der API-Keys:

- **Frontend:** Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript).
- **Backend-Proxy:** Ein serverseitiges Skript (z.B. PHP `chat.php`), das die API-Keys kapselt.
- **Sicherheit (CORS):** Der Proxy akzeptiert nur Anfragen vom definierten **Origin** der Web-App (z.B. `https://ryanaella.github.io`).
- **Schnittstellen:** Nutzt die native **Web Speech API** für Audio-Ein- und Ausgabe (lokale/Browser-seitige Verarbeitung).
- **KI-Modell:** OpenAI (Konfigurationswerte werden zentral in der `config.js` verwaltet).

## 3. Repository-Dateistruktur

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Zentrale Runtime-Konfiguration (Proxy-URL, Modell, Temperaturen).
  - `utils.js`: Zentrale Hilfsfunktionen für Text-Parsing, Bereinigung der Sprachausgabe und Protokoll-Generierung.
  - `api.js`: Abstraktionsschicht für den Datenaustausch, Cache-Management und paralleles Laden von Ressourcen.
  - `ui.js`: Modularer UI-Manager für dynamisches Rendering, Event-Binding und Multimedia-Integration (TTS/STT).
  - `app.js`: Zentrale Anwendungslogik (State-Management, Event-Handling, Modus-Steuerung) als Controller.
- `src/data/`: `exercises.json` als zentrale Konfiguration.
- `scenarios/`: Szenariodateien.
- `prompts/`: Prompt-Dateien in Unterordnern `trainers/`.

Hinweis: Ein serverseitiges Proxy-Skript wie `chat.php` ist **nicht zwingend Teil dieses Repositories**. Es kann getrennt auf dem Server liegen, damit keine Secrets im Repo landen.

## 4. Szenarien und Konfiguration

### 4.1 Die `exercises.json`

Diese Datei steuert, welche Transformation in der App zur Verfügung stehen.

```json
[
  {
    "id": "ich_botschaften_basis",
    "type": "TRANSFORMATION",
    "config": {
      "instructionFile": "scenarios/transformations/ich_botschaft_instructions.txt",
      "sourceFile": "scenarios/transformations/ich_botschaft_statements.txt"
    }
  }
]
```

### 4.2 Szenarioformat (`*.txt`)

Jedes Szenario besteht aus einem **META-Block** (Referenzierung der Prompts) und der **GUI Instruction** (Briefing für den Nutzer).

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
- **Simulation-Branch:** Spezialversion unter `/practice-edition/`.

## 7. Neues Szenario hinzufügen

1. Erstelle die Prompt-Dateien (`trainers`) unter `prompts/`.
2. Erstelle eine neue Szenario-Datei unter `scenarios/transformations/`.
3. Trage die neue ID und den Pfad in die `exercises.json` ein.

## 8. Inhalte pflegen

1. Szenario-Dateien unter `scenarios/transformations/` bearbeiten (Inhalt und GUI Instruction).
2. Prompt-Dateien in `prompts/` (trainers) anpassen.
3. Falls neue Szenarien hinzugefügt werden, `exercises.json` aktualisieren.

---

_Hinweis: Ein Klick auf „Neustart“ setzt die Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

> [!IMPORTANT]
> **Edition Note:** This is a specialized version of the application. Unlike the main version, this build focuses exclusively on **Transformation Exercises** (interactive rephrasing) and does not include a Simulation Mode.

# Socio-Informatics Lab: Transformation Lab

## 1. Project at a Glance

The **Socio-Informatics Lab: Transformation Lab** is an interactive web application that bridges the gap between psychological conversation techniques and modern AI. It provides a safe environment for users to specifically refine their communication and expression.

### Core Functions of This Edition

- **Targeted Exercises (Transformation):** The focus here is on technique. Practice rephrasing accusations into constructive messages (e.g., I-statements or positive assumptions). The AI evaluates your attempts immediately and provides tips for improvement.
- **Natural Speech Feel:** Integrated **Text-to-Speech (TTS)** with optimized emphasis brings dialogues to life. (Tip: Voices sound particularly human when using Microsoft Edge!)
- **Accessible Input:** Responses can be spoken directly using the microphone icon (**Speech-to-Text**). Note: This feature uses the browser's native Web Speech API and is currently supported by Chrome and Edge (disabled in Firefox due to missing browser support).
- **Varied Training:** Exercise situations are automatically randomized upon every start to enhance the learning effect and keep repetitions engaging.
- **Save Your Progress:** Use the **Protocol Export** to save the entire conversation history, including the briefing, as a structured text file with a single click—ideal for review and follow-up.

## 2. Technical Architecture

The application uses a static frontend with a server-side proxy to protect API keys:

- **Frontend:** Static website (HTML5, Tailwind CSS, Vanilla JavaScript).
- **Backend Proxy:** A server-side script (e.g., PHP `chat.php`) that encapsulates the API keys.
- **Security (CORS):** The proxy only accepts requests from the defined **Origin** of the web app (e.g., `https://ryanaella.github.io`).
- **Interfaces:** Uses the native **Web Speech API** for audio input and output (local/browser-side processing).
- **AI Model:** OpenAI (configuration values are managed centrally in `config.js`).

## 3. Repository File Structure

- `index.html`: UI / Layout.
- `src/js/`:
  - `config.js`: Central runtime configuration (Proxy URL, model, temperatures).
  - `utils.js`: Helper functions for text parsing, Markdown rendering, and role detection.
  - `api.js`: Manages communication with the proxy and handles loading/parsing of scenario and prompt files.
  - `ui.js`: Responsible for all DOM manipulations and visual representation of the interface.
  - `app.js`: Central application logic (state management, event handling, mode control) acting as the controller.
- `scenarios/`: Scenario and exercise files (`exercises.json` as central config, `*.txt` for scenario content).
- `prompts/`: Prompt files located in the `trainers/` subfolder.

> **Note:** A server-side proxy script like `chat.php` is **not necessarily part of this repository**. It can reside separately on the server to ensure no secrets are stored in the repo.

## 4. Scenarios and Configuration

### 4.1 The `exercises.json`

This file controls which transformations are available within the app.

```json
[
  {
    "id": "ich_botschaften_basis",
    "type": "TRANSFORMATION",
    "config": {
      "instructionFile": "scenarios/transformations/ich_botschaft_instructions.txt",
      "sourceFile": "scenarios/transformations/ich_botschaft_statements.txt"
    }
  }
]
```

### 4.2 Scenario Format (`*.txt`)

Each scenario consists of a **META block** (referencing the prompts) and the **GUI Instruction** (the briefing for the user).

```text
### META ###
title: Ich-Botschaft
trainer_prompt: ich_botschaft_trainer
short_instruction: Rephrase the accusation into an I-statement.
```

## 5. Proxy Setup & Security

Communication is handled via a PHP proxy to keep the API key secure.

### 5.1 API Key & CORS

- Store the key exclusively **server-side** within the proxy script.
- The proxy should strictly limit `Access-Control-Allow-Origin` headers to your domain.

### 5.2 Reference Implementation (`chat.php`)

The script receives the payload from the frontend, adds the Authorization header, and forwards the request to OpenAI. (A template is available in the documentation folder).

## 6. Deployment & Configuration

1. **Frontend:** Host the repository on GitHub Pages.
2. **Proxy:** Place `chat.php` on a web server with HTTPS support.
3. **Configuration:** Adjust the `PROXY_URL` in `src/js/config.js` to point to your proxy script.

### Multi-Branch Deployment

Every push to a branch triggers an automated deployment:

- **Main Branch:** Main version under the root URL.
- **Simulation Branch:** Special version under `/practice-edition/`.

## 7. Adding a New Scenario

1. Create the prompt files (`trainers`) under `prompts/`.
2. Create a new scenario file under `scenarios/transformations/`.
3. Add the new ID and file path to `exercises.json`.

## 8. Content Maintenance

1. Edit scenario files under `scenarios/transformations/` (content and GUI instruction).
2. Adjust prompt files in `prompts/` (trainers).
3. Update `exercises.json` if new scenarios are added.

---

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's volatile memory._
