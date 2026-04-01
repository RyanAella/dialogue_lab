# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.4.0] - 2026-04-01

### Added

- **Smart Briefing Toggle:** Added a focus-based trigger for mobile devices. The briefing now automatically collapses when the user clicks into the input field on mobile to maximize screen space for the keyboard and chat.

### Fixed

- **App Initialization:** Fixed a syntax error in the `startApp` function (missing closing brackets) that prevented scenario files from being loaded into the dropdown.
- **Workflow Logic:** Ensured the briefing section collapses consistently across all devices upon sending the first message, keeping the UI focused on the conversation.

### Changed

- **Responsive Interaction:** Refined the balance between context and space: The briefing stays open on desktops during typing to provide reference, while it prioritizes space on mobile devices.

---

## [0.3.0] - 2026-03-31

### Added

- **Dynamic Scenario Loading:** Scenarios are now dynamically loaded from external text files, enabling easy addition of new training cases without changing the core logic.
- **AI Partner Simulation:** Integrated GPT-4o to provide high-quality, realistic, and sometimes defensive dialogue partners to simulate challenging leadership situations.
- **AI Mentor Analysis:** Added a comprehensive feedback system. The AI Mentor analyzes the conversation transcript based on specific communication phases and provides actionable advice.
- **Transcript Export:** Users can now download their complete conversation history along with the Mentor's feedback as a text file for documentation and further study.
- **Session Management:** Added a reset functionality to clear current progress and switch between different training scenarios seamlessly.

### Changed

- **Automated Role Detection:** Improved the logic to automatically extract the conversation partner's role from scenario descriptions for a more personalized UI.

## [0.2.0] - 2026-03-31

### Added

- Responsive subtitle texts that adapt to screen width (Desktop vs. Mobile).
- Automatically collapse the briefing on initial page load for a better overview.

### Changed

- Improved focus management: The input field automatically regains focus after sending a message.
- Optimized Mobile UX: The sidebar now closes automatically once a scenario is selected.
- Refined role detection logic: Better handling of German grammar patterns (e.g., converting dative plural forms like "Mitarbeitenden").

## [0.1.0] - 2026-03-30

### Added

- Initial project structure including `index.html` and Tailwind CSS integration.
- Dynamic scenario loading from `.txt` files within the `scenarios/` directory.
- Chat logic in `app.js` for communication with the AI partner via a PHP proxy (`chat.php`).
- AI Mentor implementation to analyze conversation transcripts and provide constructive feedback.
- Role-specific prompts for both partner and mentor roles.
- UI Components:
  - Status indicator (System Ready / Loading / Error).
  - Feedback modal featuring a transcript download function.
  - Reset modal for restarting exercises.
  - Collapsible briefing section for task details.
- Project documentation (`README.md`) and Git configuration (`.gitignore`).

### Changed

- Optimized role detection: The counterpart's name is now automatically extracted from the task description.
- UI refinements for chat bubbles to enhance readability.

### Security

- Added sensitive files such as `chat.php` and `config.php` to `.gitignore` to prevent them from being committed to version control.

---

_Initial release of the Socio-Informatics Lab: Dialogue Training._
