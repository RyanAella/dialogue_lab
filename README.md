# Lab für Sozioinformatik: Gesprächstraining

## 1. Übersicht

Das **Lab für Sozioinformatik: Gesprächstraining** ist eine webbasierte Anwendung zum Trainieren von Gesprächsführung (z. B. Mitarbeitergespräche oder Konfliktmanagement). Nutzer können verschiedene Szenarien auswählen und in einem Chat-Interface mit einer KI interagieren, die eine spezifische Rolle einnimmt. Am Ende der Übung kann ein Mentor-Feedback angefordert werden.

## 2. Technische Architektur

Die Anwendung nutzt eine moderne Frontend-Struktur mit einer sicheren Backend-Brücke:

- **Frontend**: Statische Website (HTML5, Tailwind CSS, Vanilla JavaScript), gehostet auf **GitHub Pages**.
- **Backend-Proxy**: Eine PHP-Datei (`chat.php`) auf einem **Strato-Server**. Dies ist notwendig, da API-Keys niemals im Client-Code (JavaScript) stehen dürfen.
- **Sicherheit (CORS)**: Der Proxy ist so konfiguriert, dass er nur Anfragen von der offiziellen GitHub-Pages-Domain akzeptiert.
- **KI-Modell**: OpenAI GPT-4o.

## 3. Dateistruktur

- `index.html`: Das visuelle Grundgerüst und die UI-Komponenten.
- `app.js`: Die zentrale Logik (Szenarien-Parsing, Chat-Management, API-Kommunikation).
- `scenarios/`: Verzeichnis für `.txt`-Szenariodateien.
- `prompts/`: Unterordner (`system/`, `partner/`, `mentor/`) für die KI-Instruktionen.
- `chat.php`: Das PHP-Skript auf dem externen Server.

## 4. Das Szenarien-System

Ein Szenario wird über eine Textdatei gesteuert. Das JavaScript parst die Datei anhand von Markern:

### Der META-Block

```text
### META ###
title: Kritikgespräch: Verspätetes Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

_Die Namen bei den Prompts beziehen sich auf die Dateinamen im `prompts/`-Verzeichnis._

### Die GUI-Instruction

Alles nach dem Marker `### GUI INSTRUCTION ###` wird dem Nutzer als Briefing angezeigt. Die App extrahiert daraus automatisch die Rolle (z. B. "Gespräch mit dem Mitarbeiter"), um die Chat-Labels anzupassen.

## 5. Kernfunktionen der `app.js`

- **Konfiguration**: Zu Beginn der Datei wird die `PROXY_URL` definiert, die auf den Strato-Server zeigt.
- **Dynamisches Laden**: `initScenarioDropdown()` befüllt das Menü basierend auf dem Array `scenarioFiles`.
- **Fehlerbehandlung**: Sollte ein Prompt oder ein Szenario nicht geladen werden können (z. B. 404-Fehler), wird dies in der **Status-Box** unter dem Chat für den Nutzer sichtbar ausgegeben.
- **Chat-Historie**: Der Verlauf wird lokal im Array `chatHistory` gehalten und bei jeder Anfrage als Kontext mitgesendet.

## 6. Einrichtung & Deployment

### Lokale Entwicklung & Konfiguration

1.  Öffne das Projekt in **VS Code**.
2.  Stelle in der `app.js` sicher, dass die Variable `PROXY_URL` korrekt gesetzt ist:
    `const PROXY_URL = "https://deine-domain.de/path/to/chat.php";`
3.  Starte den **Live Server**, um die Anwendung lokal zu testen.

### Online bringen

1.  **GitHub**: Lade alle Dateien (außer der PHP) hoch und aktiviere **GitHub Pages** in den Repository-Einstellungen.
2.  **Strato**: Lade die `chat.php` hoch. Stelle sicher, dass dein SSL-Zertifikat aktiv ist (**https://**).

## 7. Anleitung: Ein neues Szenario hinzufügen

1.  Erstelle die drei benötigten Prompt-Dateien (System, Partner, Mentor) als `.txt`.
2.  Erstelle eine neue Datei im Ordner `scenarios/` mit dem `### META ###` und `### GUI INSTRUCTION ###` Aufbau.
3.  Füge den Dateinamen zum Array `scenarioFiles` am Anfang der `app.js` hinzu.
4.  Speichern und hochladen – die App erkennt das Szenario automatisch.

---

_Hinweis: Ein Klick auf "Neu starten" setzt die gesamte Anwendung zurück und löscht den aktuellen Chatverlauf aus dem Arbeitsspeicher des Browsers._

---

---

# Socio-Informatics Lab: Dialogue Training

## 1. Overview

The **Socio-Informatics Lab: Dialogue Training** is a web-based application designed for training communication skills (e.g., performance reviews or conflict management). Users can select various scenarios and interact with an AI via a chat interface. The AI takes on a specific persona, and at the end of the session, users can request detailed "Mentor Feedback."

## 2. Technical Architecture

The application uses a hybrid architecture to combine ease of hosting with high security:

- **Frontend**: A static website (HTML5, Tailwind CSS, Vanilla JavaScript) hosted on **GitHub Pages**.
- **Backend Proxy**: A PHP script (`chat.php`) hosted on a **Strato Server**. This acts as a secure bridge to the OpenAI API, ensuring that API keys are never exposed in the client-side code.
- **Security (CORS)**: The proxy is configured to only accept requests from your specific GitHub Pages domain.
- **AI Model**: OpenAI GPT-4o.

## 3. File Structure

- `index.html`: The visual layout and UI components.
- `app.js`: Core logic (parsing scenarios, managing chat history, API communication).
- `scenarios/`: Directory containing `.txt` files for each training exercise.
- `prompts/`: Subdirectories (`system/`, `partner/`, `mentor/`) for the underlying AI instructions.
- `chat.php`: The PHP script located on the external server.

## 4. The Scenario System

Scenarios are controlled via text files. The JavaScript logic parses these files using specific markers:

### The META Block

```text
### META ###
title: Feedback Meeting: Late Reporting
system_prompt: reporting_system_prompt
partner_prompt: reporting_partner_prompt
mentor_prompt: reporting_mentor_prompt
```

_The prompt names refer to the filenames within the `prompts/` directory._

### The GUI Instruction

Everything following the `### GUI INSTRUCTION ###` marker is displayed as a briefing to the user. The app automatically extracts the role (e.g., "Conversation with the Employee") to customize the chat labels.

## 5. Key Functions in `app.js`

- **Configuration**: The `PROXY_URL` variable at the top of the file points to your external backend.
- **Dynamic Loading**: `initScenarioDropdown()` populates the menu based on the `scenarioFiles` array.
- **Error Handling**: If a prompt or scenario fails to load (e.g., 404 error), a clear message is displayed in the **Status Box** below the chat.
- **Chat History**: The conversation is stored in a local `chatHistory` array and sent as context with every new request.

## 6. Setup & Deployment

### Local Development & Configuration

1. Open the project in **VS Code**.
2. Ensure the `PROXY_URL` variable in `app.js` is set correctly:
   `const PROXY_URL = "https://your-domain.com/path/to/chat.php";`
3. Launch **Live Server** to test the application locally.

### Going Live

1. **GitHub**: Push all files (except the PHP file) and enable **GitHub Pages** in the repository settings.
2. **Strato**: Upload the `chat.php`. Ensure your SSL certificate is active (**https://**).

## 7. How to Add a New Scenario

1. Create the three required prompt files (System, Partner, Mentor) as `.txt` files in their respective folders.
2. Create a new scenario file in the `scenarios/` folder using the `### META ###` and `### GUI INSTRUCTION ###` format.
3. Add the filename to the `scenarioFiles` array at the beginning of `app.js`.
4. Save and upload—the app will automatically detect and list the new scenario.

---

_Note: Clicking "Restart" will reset the application and wipe the current chat history from the browser's memory._
