# Lab für Sozioinformatik: Transformation Lab

> [!IMPORTANT]
> **Edition-Hinweis:** Dies ist eine spezialisierte Version der Anwendung. Im Gegensatz zur Hauptversion konzentriert sich dieser Stand ausschließlich auf **Transformations-Übungen** (interaktive Umformulierungen) und enthält keinen Dialogsimulationen (Rollenspiele).

## 1. Das Projekt auf einen Blick

Das **Lab für Sozioinformatik: Transformation Lab** ist eine interaktive Web-Anwendung, die die Brücke zwischen psychologischer Gesprächsführung und moderner KI schlägt. Nutzer können hier in einem geschützten Raum gezielt an ihrer Ausdrucksweise arbeiten.

### Kernfunktionen dieser Edition

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

- `src/data/exercises.json`: Der zentrale Katalog aller verfügbaren Übungen.
- `scenarios/`: Enthält die Übungsdateien (Instruktionen und Aussagen) für Transformations-Übungen.
- `prompts/`: Unterordner für KI-Prompts (`system/`, `partner/`, `mentor/`).

## 4. Szenarien und Konfiguration

Dieser Abschnitt beschreibt, wie die Inhalte für die Übungen strukturiert und konfiguriert werden. Die App trennt strikt zwischen Code und Inhalt, um eine einfache Wartung und Erweiterung zu ermöglichen.

### 4.1 Die `exercises.json`

Diese Datei steuert alle verfügbaren Inhalte.

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

### 4.2 Übungsformat & Prompt-Mapping (`*.txt`)

Jede Übung besteht aus einem **META-Block** (Referenzierung der Prompts) und der **GUI Instruction** (Briefing für den Nutzer).

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
3. **Konfiguration:** Die `PROXY_URL` in `src/js/core/config.js` an den Pfad deines Proxy-Skripts anpassen.

### Multi-Branch Deployment

Jeder Push auf einen Branch löst ein automatisches Deployment aus:

- **Main-Branch:** Hauptversion unter der Root-URL.
- **Feature-Branches:** Werden automatisch in Unterverzeichnisse (z. B. `.../feature-xyz/`) bereitgestellt, was paralleles Testen ermöglicht.

## 7. Neue Übung hinzufügen

1. **Trainer-Prompt:** Eine Datei in `prompts/trainer/` anlegen (für das KI-Feedback).
2. **Inhalts-Dateien:** In `scenarios/transformations/` eine Datei für die Instruktionen (`instructions.txt`) und eine für die Aussagen-Liste (`statements.txt`) erstellen.
3. **Pool erweitern:** Die neue Übung in `src/data/exercises.json` registrieren und dabei die Pfade zu `sourceFile` (Aussagen) und `instructionFile` (Briefing) angeben.
4. **Avatar-Mapping:** Optional den `role_label` in der META-Sektion der Instruktions-Datei anpassen, um einen spezifischen Pool aus `profiles.js` zu laden.

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

# Socio-Informatics Lab: Transformation Lab

> [!IMPORTANT]
> **Edition Note:** This is a specialized version of the application. Unlike the main version, this build focuses exclusively on **Transformation Exercises** (interactive rephrasing) and does not include a Simulation Mode.

## 1. Project at a Glance

The **Socio-Informatics Lab: Transformation Lab** is an interactive web application that bridges the gap between psychological conversation techniques and modern AI. It provides a safe environment for users to specifically refine their communication and expression.

### Core Functions of This Edition

- **Targeted Exercises (Transformation)**
  The focus here is on technique. Practice rephrasing accusations into constructive messages (e.g., I-statements or positive assumptions). The AI generates a comprehensive overall evaluation of your phrasing after the exercise series is completed or upon request.
- **Visual Immersion:**
  A modular **Avatar System** generates dynamic portraits based on character pools. Through the layering of head (with automatic skin tone detection), clothing, hair, glasses, and headsets, varied and appropriate conversation partners are created at every start.

### Highlights for the User Experience

- **Accessible Input:** Responses can be spoken directly using the microphone icon (**Speech-to-Text**). Note: This feature uses the browser's native Web Speech API and is currently supported by Chrome and Edge (disabled in Firefox due to missing browser support).
- **Visual Feedback:** An animated **Typing Indicator** signals to the user immediately when the AI is generating a response, reducing perceived waiting time.
- **Natural Speech Feel:** Integrated **Text-to-Speech (TTS)** with optimized emphasis and automatic pauses at punctuation marks brings dialogues to life. A global **Stop Button** in the sidebar allows users to immediately cancel the output at any time. (Tip: Voices sound particularly human when using Microsoft Edge!)
- **Save Your Progress:** Use the **Protocol Export** to save the entire conversation history, including the initial briefing, as a structured text file (`[Mode]_[Title]_[Date].txt`) with a single click—ideal for review or documenting learning progress.
- **Varied Training:** Exercise situations in Transformation Mode are automatically randomized upon every start to enhance the learning effect and keep repetitions engaging.

## 2. Technical Architecture

The application uses a static frontend with a server-side proxy to protect API keys:

- **Frontend**: Static website (HTML5, Tailwind CSS, Vanilla JavaScript), e.g., hosted on **GitHub Pages**.
- **Architecture**: Modular structure following the **Separation of Concerns** principle. Clear separation between UI control, API communication, and helper functions.
- **Backend Proxy**: A small server-side script (e.g., PHP `chat.php`) on any web server/hosting. This is necessary because API keys must never be present in the client-side code (JavaScript).
- **Modular Graphics System**: The partners are represented via an "Avatar Stack" (CSS Grid). Images are combined at runtime to represent different skin tones, accessories, and animations (blinking, mouth movements).
- **Security (CORS)**: The proxy should strictly limit `Access-Control-Allow-Origin` headers to your domain (e.g., `https://ryanaella.github.io`). Note: **Origin = Schema + Domain**, not the path.
- **Interfaces:** Uses the native **Web Speech API** for audio input and output (local/browser-side processing).
- **Robust Communication**: Implementation of `AbortController` to avoid race conditions during API requests.

## 3. Repository File Structure

### Core Modules (`src/js/`)

| Module            | Responsibility                                                                     |
| :---------------- | :--------------------------------------------------------------------------------- |
| **`app.js`**      | **Controller**: Orchestrates the program flow and initializes the services.        |
| **`ui.js`**       | **View Manager**: Manages DOM elements, event listeners, and chat rendering.       |
| **`avatar.js`**   | **Visuals**: Controls the multi-layer system, animations (blinking), and lip-sync. |
| **`speech.js`**   | **Audio Service**: Encapsulates TTS (speech output) and STT (dictation function).  |
| **`chat.js`**     | **State Manager**: Holds the conversation history and prepares transcripts.        |
| **`scenario.js`** | **Data Service**: Loads exercise pools and manages the active scenario state.      |
| **`api.js`**      | **Network**: Handling API requests with integrated caching.                        |
| **`utils.js`**    | **Helpers**: Static functions for Markdown parsing and text cleaning.              |
| **`profiles.js`** | **Assets**: Configuration of character pools and graphic layers.                   |

### Data & Content

- `src/data/exercises.json`: Central catalog of all available transformation exercises.
- `scenarios/`: Contains exercise files (instructions and statements) for transformation exercises.
- `prompts/`: Subfolders for AI prompts (`system/`, `partner/`, `mentor/`).

## 4. Scenarios and Configuration

This section describes how the content for exercises is structured and configured. The app strictly separates code and content to allow for easy maintenance and expansion.

### 4.1 The `exercises.json`

This file controls all available content.

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

### 4.2 Exercise Format (`*.txt`)

Each exercise consists of a **META block** (referencing the prompts) and the **GUI Instruction** (the briefing for the user).

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
3. **Configuration:** Adjust the `PROXY_URL` in `src/js/core/config.js` to point to your proxy script.

### Multi-Branch Deployment

Every push to a branch triggers an automated deployment:

- **Main Branch:** Main version under the root URL.
- **Transformation Branch:** Main version under `/practice-edition/`. Have a look at the `practice-edition` branch.

## 7. Adding a New Exercise

1. **Trainer Prompt:** Create a feedback prompt file in `prompts/trainer/`. 
2. **Content Files:** Create the instruction (briefing) and statements (sentences) `.txt` files in `scenarios/transformations/`. Have a look at the existing exercises as templates.
3. **Register:** Add the new ID and respective file paths (`sourceFile` and `instructionFile`) to `src/data/exercises.json`.
4. **Avatar Mapping:** Ensure the `role_label` in the metadata matches a key in `profiles.js` to load the correct character pool.

## 8. Content Maintenance

1. Edit exercise files under `scenarios/transformations/` (content and GUI instruction).
2. Adjust prompt files in `prompts/trainer/` as needed.
3. Update `exercises.json` if new exercises are added.

---

_Note: Clicking "Restart" resets the application and clears the current chat history from the browser's volatile memory._
