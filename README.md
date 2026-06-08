# Lab für Sozioinformatik: Gesprächstraining

## 1. Das Projekt auf einen Blick

Das **Lab für Sozioinformatik: Simulation Lab** ist eine interaktive Web-Anwendung, die die Brücke zwischen psychologischer Gesprächsführung und moderner KI schlägt. Nutzer können hier in einem geschützten Raum komplexe Gesprächssituationen trainieren und direktes Feedback erhalten.

### Kernfunktionen & Modi

Die Anwendung bietet zwei spezialisierte Trainingsumgebungen:

- **Interaktive Simulationen (Rollenspiel)**
  Tauche in realistische Gesprächsszenarien ein. Ein KI-Gegenüber reagiert dynamisch auf deine Eingaben, während ein optionaler **KI-Mentor** im Hintergrund wertvolles Feedback zu deiner Strategie gibt.
- **Gezielte Übungen (Transformation)**
  Hier liegt der Fokus auf der Technik. Trainiere das Umformulieren von Vorwürfen in konstruktive Botschaften (z. B. Ich-Botschaften oder Positive Unterstellungen). Die KI erstellt nach Abschluss der Übungsreihe oder auf Wunsch eine umfassende Gesamtauswertung deiner Formulierungen.
- **Visuelle Immersion:**
  Ein modulares **Avatar-System** generiert basierend auf Charakter-Pools dynamische Portraits. Durch das Layering von Kopf (mit automatischer Hautton-Erkennung), Kleidung, Haaren, Brillen und Headsets entstehen bei jedem Start abwechslungsreiche und passende Gesprächspartner.

### Highlights für die User Experience

- **Barrierefreie Eingabe:** Über das Mikrofon-Symbol können Antworten direkt eingesprochen werden (**Speech-to-Text**). Hinweis: Diese Funktion nutzt die native Web Speech API und wird aktuell von Chrome und Edge unterstützt (in Firefox technisch bedingt deaktiviert).
- **Visuelles Feedback:** Ein animierter **Typing Indicator** (Schreib-Indikator) signalisiert dem Nutzer sofort, wenn die KI eine Antwort generiert, was die gefühlte Wartezeit verkürzt.
- **Natürliches Sprachgefühl:** Dank integrierter **Sprachausgabe (TTS)** mit optimierter Betonung und automatischen Pausen bei Satzzeichen werden die Dialoge lebendig. Ein globaler **Stop-Button** in der Sidebar erlaubt es, die Ausgabe jederzeit sofort abzubrechen. (Tipp: In Microsoft Edge klingen die Stimmen besonders menschlich!)
- **Fortschritt sichern:** Über den **Protokoll-Export** lässt sich der gesamte Gesprächsverlauf inklusive des ursprünglichen Briefings mit einem Klick als strukturierte Textdatei (`[Modus]_[Titel]_[Datum].txt`) speichern – ideal für die Nachbereitung oder zur Dokumentation von Lernfortschritten.
- **Abwechslungsreiches Training:** Die Übungen im Transformations-Modus werden bei jedem Start automatisch zufällig angeordnet, um den Lerneffekt zu steigern und Wiederholungen interessanter zu gestalten.

## 2. Technische Architektur

Die Anwendung kombiniert ein statisches Frontend mit einem serverseitigen Proxy (für API-Key-Schutz):

- **Frontend**: Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript), z.B. gehostet auf **GitHub Pages**.
- **Architektur**: Modulare Struktur nach dem **Separation of Concerns** Prinzip. Klare Trennung zwischen UI-Steuerung, API-Kommunikation und Hilfsfunktionen.
- **Backend-Proxy**: Ein kleines serverseitiges Skript (z.B. PHP `chat.php`) auf einem beliebigen Webserver/Hosting. Das ist notwendig, da API-Keys niemals im Client-Code (JavaScript) stehen dürfen.
- **Modulares Grafik-System**: Die Darstellung der Partner erfolgt über einen "Avatar-Stack" (CSS Grid). Bilder werden zur Laufzeit kombiniert, um verschiedene Hauttöne, Accessoires und Animationen (Blinzeln, Mundbewegungen) darzustellen.
- **Sicherheit (CORS)**: Der Proxy sollte nur Anfragen vom **Origin** akzeptieren, auf dem die Web-App läuft (z.B. `https://ryanaella.github.io`). Wichtig: **Origin = Schema + Domain**, nicht der Pfad (also nicht `.../dialogue_lab/`).
- **Schnittstellen:** Nutzt die native **Web Speech API** für Audio-Ein- und Ausgabe (lokale/Browser-seitige Verarbeitung).
- **Robuste Kommunikation**: Implementierung von `AbortController` zur Vermeidung von Race-Conditions bei API-Anfragen.

## 3. Repository-Dateistruktur

### Kern-Module (`src/js/`)

| Modul             | Verantwortung                                                                              |
| :---------------- | :----------------------------------------------------------------------------------------- |
| **`app.js`**      | **Controller**: Orchestriert den Programmfluss und initialisiert die Services.             |
| **`ui.js`**       | **View-Manager**: Verwaltet DOM-Elemente, Event-Listener und das Chat-Rendering.           |
| **`avatar.js`**   | **Visuals**: Steuert das Multi-Layer-System, Animationen (Blinken) und Lippensynchronität. |
| **`speech.js`**   | **Audio-Service**: Kapselt TTS (Sprachausgabe) und STT (Diktierfunktion).                  |
| **`chat.js`**     | **State-Manager**: Hält die Gesprächshistorie und bereitet Transkripte vor.                |
| **`scenario.js`** | **Data-Service**: Lädt Übungspools und verwaltet das aktive Szenario-State.                |
| **`api.js`**      | **Network**: Handling der API-Anfragen mit integriertem Caching.                           |
| **`utils.js`**    | **Helpers**: Statische Funktionen für Markdown-Parsing und Text-Bereinigung.               |
| **`profiles.js`** | **Assets**: Konfiguration der Charakter-Pools und Grafik-Ebenen.                           |

### Daten & Inhalte

- `src/data/exercises.json`: Der zentrale Katalog aller verfügbaren Simulationen.
- `scenarios/`: Markdown-ähnliche Szenario-Beschreibungen und GUI-Instruktionen.
- `prompts/`: Unterordner für KI-Prompts (`system/`, `partner/`, `mentor/`).

## 4. Szenarien und Konfiguration

Dieser Abschnitt beschreibt, wie die Inhalte für die Simulationen strukturiert und konfiguriert werden. Die App trennt strikt zwischen Code und Inhalt, um eine einfache Wartung und Erweiterung zu ermöglichen.

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

### 4.2 Szenarioformat & Prompt-Mapping (`*.txt`)

Jedes Szenario besteht aus einem **META-Block** (Referenzierung der Prompts) und der **GUI Instruction** (Briefing für den Nutzer).

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
- **Feature-Branches:** Werden automatisch in Unterverzeichnisse (z. B. `.../feature-xyz/`) bereitgestellt, was paralleles Testen ermöglicht.

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

# Socio-Informatics Lab: Conversation Training

## 1. Project at a Glance

The **Socio-Informatics Lab: Dialogue Lab** is an interactive web application that bridges the gap between psychological communication techniques and modern AI. Users can practice complex conversation scenarios in a safe environment and receive direct feedback.

### Core Functions & Modes

The application offers two specialized training environments:

- **Interactive Simulations (Roleplay):** Immerse yourself in realistic conversation scenarios. An AI counterpart reacts dynamically to your input, while an optional **AI Mentor** provides valuable background feedback on your strategy.
- **Targeted Exercises (Transformation):** This mode focuses on technique. Practice rephrasing accusations into constructive messages (e.g., "I-statements" or positive assumptions). The AI generates a comprehensive overall evaluation of your phrasing after the exercise series is completed or upon request.
- **Visual Immersion:**
  A modular **Avatar System** generates dynamic portraits based on character pools. By layering heads (with automatic skin tone detection), clothing, hair, glasses, and headsets, varied and appropriate conversation partners are created each time you start.

### User Experience Highlights

- **Accessible Input:** Responses can be spoken directly using the microphone icon (**Speech-to-Text**). Note: This feature uses the browser's native Web Speech API and is currently supported by Chrome and Edge (disabled in Firefox due to missing browser support).
- **Visual Feedback:** An animated **typing indicator** signals when the AI is generating a response, enhancing the interactive feel.
- **Natural Speech Flow:** Integrated **Text-to-Speech (TTS)** with context-aware rate and pitch modulation creates lifelike dialogues. Optimized for Microsoft Edge (Neural Voices).
- **Track Your Progress:** Use the **Transcript Export** feature to save the entire conversation history, including the briefing, as a structured text file (`[Mode]_[Title]_[Date].txt`) with a single click—perfect for review or documenting learning progress.
- **Varied Training:** Exercises in transformation mode are automatically randomized upon every start to enhance the learning effect and keep repetitions engaging.

## 2. Technical Architecture

The application combines a static frontend with a server-side proxy (for API key protection):

- **Frontend:** Static website (HTML5, Tailwind CSS, Vanilla JavaScript), e.g., hosted on **GitHub Pages**.
- **Architecture**: Modular structure based on **Separation of Concerns**. Clear distinction between UI management, API communication, and utility logic.
- **Backend Proxy:** A small server-side script (e.g., PHP `chat.php`) on any web server/hosting. This is necessary because API keys must never be exposed in client-side code (JavaScript).
- **Modular Graphics System:** The representation of partners is handled via an "Avatar Stack" (CSS Grid). Images are combined at runtime to represent different skin tones, accessories, and animations (blinking, mouth movements).
- **Security (CORS):** The proxy should only accept requests from the **Origin** where the web app is running (e.g., `https://ryanaella.github.io`). Important: **Origin = Scheme + Domain**, not the path (i.e., not `.../dialogue_lab/`).
- **Interfaces:** Uses the native **Web Speech API** for audio input and output.
- **Robust Networking**: Usage of `AbortController` to prevent race conditions during concurrent API requests.

## 3. Repository File Structure

### Core Modules (`src/js/`)

| Module            | Responsibility                                                                        |
| :---------------- | :------------------------------------------------------------------------------------ |
| **`app.js`**      | **Controller**: Orchestrates the application flow and initializes services.           |
| **`ui.js`**       | **View-Manager**: Manages DOM elements, event listeners, and chat rendering.          |
| **`avatar.js`**   | **Visuals**: Controls the multi-layer system, animations (blinking), and lip-syncing. |
| **`speech.js`**   | **Audio-Service**: Encapsulates TTS (Speech Output) and STT (Dictation).              |
| **`chat.js`**     | **State-Manager**: Maintains conversation history and prepares transcripts.           |
| **`scenario.js`** | **Data-Service**: Loads exercise pools and manages the active scenario state.         |
| **`api.js`**      | **Network**: Handles API requests with integrated caching.                            |
| **`utils.js`**    | **Helpers**: Static functions for markdown parsing and text cleaning.                 |
| **`profiles.js`** | **Assets**: Configuration of character pools and graphic layers.                      |

### Data & Content

- `src/data/exercises.json`: The central catalog of all available simulations.
- `scenarios/`: Markdown-like scenario descriptions and GUI instructions.
- `prompts/`: Subfolders for AI prompts (`system/`, `partner/`, `mentor/`).

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

### GUI INSTRUCTION ###
Here follows the briefing shown to the user before starting...
```

**Variant B: Transformations (Exercise Mode)**

```text
### META ###
title: I-Statements Basics
trainer_prompt: ich_botschaft_trainer
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
- **Feature Branches:** Automatically deployed to subdirectories (e.g., `.../feature-xyz/`), enabling parallel testing of features.

## 7. Adding a New Scenario

1.  **Create Prompts:** Add three files to `prompts/system/`, `prompts/partner/`, and `prompts/mentor/`.
2.  **Scenario File:** Create a `.txt` file in `scenarios/simulations/`. Reference the new prompt filenames in the `### META ###` block (without extensions).
3.  **Register Exercise:** Add the new ID and path to `src/data/exercises.json`.
4.  **Avatar Mapping:** Ensure the `role_label` in the META section matches a key in `profiles.js` to load the correct character pool.

## 8. Content Maintenance

### Best Practices for Prompts

- **Avoid Meta-Talk:** AI partners should never discuss "phases" or "prompts"; they must remain in character.
- **Objection Rotation:** Include a list of 4-5 objections in the partner prompt to ensure variety across sessions.
- **Structured Mentor Output:** Use clear separators (e.g., `---`) in the mentor prompt so `utils.js` can render the feedback cleanly in the modal.

### Graphics & Assets

Place new avatars in the `src/assets/Character/` folder. Use skin tone suffixes (e.g., `head_v1_a.png` to `head_v1_d.png`) to enable automatic hand graphic matching.

---

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's volatile memory._
