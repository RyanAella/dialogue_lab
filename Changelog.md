# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.7.0] - 2026-04-08

### Added

- **Centralized Exercise Configuration:** `exercises.json` now serves as the single source of truth for all exercise types (Transformation and Simulation), replacing `scenarios/index.json` and `scenarios/ich_botschaft_mode.json`.
- **Dedicated Folder Structure for Transformation Exercises:** Introduced `scenarios/transformations/` for content files (e.g., `ich_botschaft_statements.txt`, `ich_botschaft_instructions.txt`) and `prompts/trainers/` for feedback prompts (e.g., `ich_botschaft_trainer.txt`).
- **Generic Transformation Mode Function:** Implemented `switchToTransformationMode` to handle all transformation-based exercises dynamically, making it easier to add new exercise types.
- **Unified Input UI Control:** Added `updateInputUI` helper function for consistent styling and state management of input elements across different modes and error states.
- **Modal-Sidebar Interaction:** Implemented logic to automatically close the mobile sidebar when a modal (feedback or reset) is opened, improving UX on smaller screens.

### Changed

- **Removed Redundant Configuration Files:** `scenarios/index.json` and `scenarios/ich_botschaft_mode.json` have been removed, as their functionality is now integrated into `exercises.json`.
- **Consistent Prompt Management:** Prompt references are now exclusively managed via `META` blocks in content files (e.g., `trainer_prompt` for transformation exercises), removing direct file paths from `exercises.json`.
- **Dynamic Exercise Titles:** Exercise titles are now dynamically loaded from `META` blocks in instruction/scenario files, removing redundant title fields from `exercises.json`.
- **Improved Text Rendering:** Implemented consistent use of `white-space: pre-wrap` for rendering text from `.txt` files and simplified rendering functions (`appendText`, `renderBoldMarkdownWithLineBreaks`) to avoid double line breaks and ensure accurate display of content.
- **Updated I-Message Content:** The content of `scenarios/transformations/ich_botschaft_instructions.txt` and `prompts/trainers/ich_botschaft_trainer.txt` has been updated for clarity, improved formatting, and adherence to the new `pre-wrap` rendering.
- **Refactored Mobile Menu Logic:** Simplified `toggleMobileMenu` function for clearer behavior and removed redundant scroll-locking commands.

### Fixed

- **Critical Bug: Double Reading of Response Body:** Corrected the `loadIchBotschaftStatements` function to prevent double reading of `response.text()`, which caused script errors.
- **Initialization Race Condition:** Resolved a race condition in `DOMContentLoaded` and `startApp` that caused "Configuration for I-Messages not found" errors by ensuring `exercises.json` is fully loaded before attempting to switch modes.
- **Robust Error Handling:** Removed hardcoded fallback values for scenario files and prompts in `app.js`. The application now displays explicit, user-friendly error messages and disables input if configurations or content files are missing or invalid, preventing interaction with an incomplete state.
- **UI State Consistency on Error:** Ensured that input fields remain disabled and error messages are prominently visible when loading fails, providing clear feedback to the user.
- **Syntax Errors:** Corrected various syntax errors and `this` references in `app.js` related to the `updateInputUI` helper function and the `switchToTransformationMode` function.
- **Z-Index Overlap:** Adjusted `z-index` values in `index.html` for modals, sidebar, and overlays to ensure correct visual layering.
- **`closeMobileMenuIfOpen` Scope:** Ensured `closeMobileMenuIfOpen` is defined in the global scope to be accessible by modal functions, resolving `ReferenceError`.
- **Enhanced API Error Reporting:** Updated `callChatApi` to provide detailed error logs including HTTP status and response text for better debugging.

---

## [0.6.0] - 2026-04-07

### Added

- **Scenario Validation Layer:** Added structured scenario parsing with explicit runtime validation for required markers and META fields (`system_prompt`, `partner_prompt`, `mentor_prompt`).
- **Central API Configuration:** Introduced centralized API constants in `app.js` (`PROXY_URL`, `MODEL`, `CHAT_TEMPERATURE`, `MENTOR_TEMPERATURE`) and a shared `callChatApi()` request helper.
- **Safe Text Rendering Helpers:** Added DOM-based rendering helpers to safely display chat and mentor text while preserving line breaks and lightweight `**bold**` formatting.
- **Dual-Mode Training Flow:** Added a mode switch for `Gesprächstraining` and `Ich-Botschaften`, including dedicated exercise actions (`Überarbeiten`, `Nächste Aussage`).
- **Externalized Runtime Config:** Added `config.js` as centralized frontend runtime configuration loaded before `app.js`.
- **Scenario Index File:** Added `scenarios/index.json` so dialogue scenarios are managed via data instead of hardcoded arrays.
- **I-Message Mode Files:** Added `scenarios/ich_botschaft_mode.json`, `scenarios/ich_botschaft_statements.txt`, and `prompts/system/ich_botschaft_feedback_prompt.txt` for file-based exercise content and prompt control.

### Changed

- **Secure UI Rendering:** Replaced critical `innerHTML` usage for model-generated message content with safe text-node based rendering to reduce injection risk.
- **Prompt File Format:** Cleaned up partner and mentor prompt files by removing wrapper syntax (`partner_de = """` / `mentor_de = """`), so prompts are now plain text only.
- **Documentation Overhaul:** Reworked `README.md` (DE/EN) to be hosting-agnostic, with clearer proxy/CORS guidance, scenario validation behavior, mode architecture, and new file-based configuration/prompt locations.
- **Exercise Source Cleanup:** Converted imported worksheet/training text assets into readable UTF-8/ASCII-safe `.txt` files for consistent editing.
- **I-Message UX Refinements:** Improved mode-specific UI clarity with hidden scenario selector in I-message mode, explicit mode badge, differentiated `Aufgabe` vs `Feedback` message styling, simplified labels, and clearer exercise action hierarchy including restart.

### Fixed

- **Scenario Error Handling:** Improved failure behavior for malformed scenario files by surfacing explicit format errors instead of continuing with incomplete state.
- **Mode Restore on Reload:** Fixed a state mismatch where browser-restored mode selection (e.g., `Ich-Botschaften`) could still initialize roleplay UI on page reload.
- **Mode Switch Consistency:** Fixed visual/state carryover when switching from `Ich-Botschaften` back to `Gesprächstraining` by enforcing a clean roleplay re-initialization (chat reset, input baseline, scenario reload).

---

## [0.5.0] - 2026-04-02

### Added

- **Visual Avatars:** Integrated `grafik.png` as a profile picture for female dialogue partners to enhance visual immersion.
- **Portrait Format Styling:** Implemented a new portrait-style avatar (rectangular with rounded corners) for female roles, while keeping standard roles circular for visual distinction.
- **Gender-Based UI Logic:** Added automatic detection for female roles using the "-in" suffix to dynamically switch between avatar styles.

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
