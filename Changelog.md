# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.21.0] - 2026-06-26

### Changed
- **UI/UX Enhancement**: Repositioned the briefing toggle (chevron) to the left of the header text for improved discoverability and alignment with common design patterns.
- **Chevron Animation Logic**: Standardized and synchronized rotation to -90 degrees across `app.js` and `ui.js` to ensure a smooth, direct animation when collapsing.

## [0.20.0] - 2026-06-24

### Changed

- **Asset Allocation Optimization**: Centralized head image references in `profiles.js` into shared constants (`SHARED_FEMALE_HEADS`, `SHARED_MALE_HEADS`) to eliminate redundancy and simplify maintenance.

### Removed

- **"Mother" Character Profile**: Removed the "Mutter" character and its specific assets from the female character pool.

## [0.19.1] - 2026-06-12

### Fixed

- **Transformation Mode Flow**: Resolved an issue where the AI would incorrectly provide a conversational response or "solve" the task. The system now automatically advances to the next statement immediately after user submission.

### Changed

- **Code Documentation**: Finished translating all remaining internal source code comments, CSS logic descriptions, and HTML metadata from German to English for project-wide consistency.
- **UX Optimization**: Refined input field behavior in Transformation mode to remain enabled between exercises, allowing for a faster and more intuitive workflow.

---

## [0.19.0] - 2026-06-09

### Added

- **Service-Oriented Architecture**: Extracted core logic into standalone ES6 modules: `Avatar`, `Speech`, `Chat`, and `ScenarioService`.
- **JSDoc Standardization**: Implemented comprehensive English JSDoc comments across all core utility and service modules for better maintainability and IDE support.
- **Modular Avatar System**: Introduced `profiles.js` to manage character pools and multi-layered graphics (Base, Hair, Clothes, Hands, Glasses, Headset).
- **Dynamic Character Randomization**: Implemented a two-tier randomization logic that first selects a character base from a pool and then randomizes individual traits for maximum variety.
- **Skin Tone Consistency**: Added automatic skin tone detection from head assets (e.g., `_a.png`) to ensure matching hand graphics are selected.
- **Accessory Layers**: Added support for optional layers including glasses and headsets, positioned correctly using the `head` layer as anchor.
- **Portrait Focus Layout**: Implemented a 3:4 aspect ratio with `object-fit: cover` and `object-position: top` to focus on the character's upper body and face.
- **In-Memory Caching**: Implemented a `Map`-based caching system in `api.js` with TTL logic to reduce redundant network requests for prompt files.

### Changed

- **Controller Refactoring**: Simplified `app.js` and `ui.js` by delegating business logic, state management, and multimedia handling to specialized services.
- **Enhanced Utility Layer**: Added `downloadFile` helper and refined text-to-speech cleaning logic in `utils.js`.
- **Documentation Overhaul**: Completely updated the `README.md` to reflect the new modular structure and define clear responsibilities for each module.
- **Refactored Asset Management**: Moved character configurations to `profiles.js` and standardized layer naming (transition from `body` to `head`).
- **Layered Chat Bubbles**: Updated the miniature avatars in the chat history to use the same layered rendering system as the main portrait for visual consistency.
- **Fallback Mechanism**: Improved the role-to-profile mapping to use a robust fallback to a default pool if no specific role match is found.

### Fixed

- **Broken Image Fallback**: Implemented a transparent pixel fallback for missing or empty optional layers (like glasses or headsets) to prevent broken image icons.
- **Z-Index Layering**: Corrected the rendering order to ensure hair correctly overlaps headsets and glasses where appropriate.
- **Silent Abort**: Improved `api.js` to gracefully handle `AbortError` without triggering UI error states when requests are cancelled.

## [0.18.0] - 2026-05-15

### Added

- **Exercise Preparation**: Added state structure for tracking transformation answers and exercise progress.
- **Functional Sidebar Reset**: The sidebar reset button is now fully functional, featuring a confirmation dialog and state cleanup.

### Changed

- **UI Reorganization**: Moved primary control actions (Evaluation, Reset) to the sidebar to clean up the chat footer and improve navigation.
- **Button Logic Refinement**: The "Create Evaluation" button now dynamically activates only after the first response is provided and can be used for early termination.
- **Localization**: Translated all internal code comments in `app.js` and `ui.js` from German to English to align with standard development practices.
- **State Reset**: Enhanced the `restartTransformationExercise` logic to restore the UI to its absolute initial state, including button visibility and instruction expansion.

### Fixed

- **Button Padding**: Corrected horizontal padding (`px-4`) on sidebar buttons to prevent text from touching the edges.
- **Evaluation Text Alignment**: Fixed a selector issue where the button text for the evaluation trigger was not updating correctly during state resets.
- **Event Listener Duplication**: Cleaned up conflicting event listeners on the sidebar download button.

---

## [0.17.0] - 2026-05-11

### Added

- **Typing Indicator**: Integrated a visual animated bubble to signal AI response generation, improving perceived performance and user engagement.
- **Request Abstraction**: Implemented a unified `_request` helper in `api.js` to centralize error handling, cache-busting, and network timeout logic.

### Changed

- **Project Specialization**: Transitioned to the "Transformation Lab" edition, streamlining the UI and logic to focus exclusively on interactive rephrasing exercises.
- **UI Componentization**: Refactored the monolithic `appendMessage` function in `ui.js` into specialized private methods (`_createAvatar`, `_createMessageBody`) for better maintainability.
- **Race Condition Protection**: Integrated `AbortController` into the API layer to automatically cancel stale requests when new ones are initiated.
- **Initialization Flow**: Decoupled application startup in `app.js` by separating concerns into `startApp`, `setupEventListeners`, and `initializeCurrentMode`.
- **Automatic DOM Binding**: Replaced manual element selection with a programmatic `_bindElements` helper in `ui.js` to reduce boilerplate code.
- **Heuristic Role Detection**: Enhanced `utils.js` with advanced role name extraction and normalization logic to better handle dynamic scenario briefings.

### Fixed

- **Transcript Completeness**: Ensured both user and assistant messages are consistently tracked in `STATE.chatHistory` across all modes for accurate protocol exports.
- **XSS Prevention**: Updated status messages to use `textContent` instead of `innerHTML` for dynamic content.
- **Voice Loading Resilience**: Added fallback logic for browser-specific delays in loading the `speechSynthesis` voices list.

---

## [0.16.0] - 2026-05-06

### Changed

- **README Documentation**: Comprehensive documentation update to reflect current application state and improve accuracy for developers and users.

### Fixed

- **File Path Corrections**: Fixed incorrect file paths in README documentation:
  - `scenarios/exercises.json` → `src/data/exercises.json`
  - Updated repository structure to accurately reflect current organization
- **Example Consistency**: Corrected inconsistent example IDs and file paths in both German and English documentation

---

## [0.15.0] - 2026-05-05

### Added

- **Exercise Randomization**: Implemented a Fisher-Yates shuffle algorithm to randomize the order of statements in Transformation Mode upon start and restart, ensuring a more dynamic and effective learning experience by preventing repetitive patterns.

---

## [0.14.0] - 2026-05-01

### Added

- **Speech-to-Text (STT)**: Integration of the native Web Speech API for voice input via a dedicated microphone button.
  Intelligent Browser Handling: Implementation of an "informative deactivation" pattern for Firefox, providing user guidance (tooltips) when native support is missing.

### Changed

- **UI Feedback**: Added pulsing animation and color changes for the microphone icon to indicate active listening states.
- **Input Control Synchronization**: Updated UI logic to ensure the microphone button's state is correctly managed across different app modes and loading states.

---

## [0.13.0] - 2026-04-24

### Added

- **Enhanced Transcript Export**: The exported text file now automatically includes the original briefing/task description at the beginning for better context.
- **Smart File Naming**: Implemented a structured naming convention for exports (`[Mode]_[Scenario-Title]_[Date].txt`) including automatic filename sanitization.

---

## [0.12.0] - 2026-04-23

### Added

- **Text-to-Speech (TTS)**: Optional automatic read-aloud function for chat messages and briefings.
- **Natural Pauses**: Implementation of text transformation converting punctuation (colons, line breaks) into synthetic pauses to improve readability of headings and lists.
- **Role Profiles**: Differentiated speech parameters (rate/pitch) for mentor and dialogue partners to increase immersion.
- **Global Stop Button**: Sidebar button to immediately cancel all active speech output.

### Fixed

- **Start-Clipping Fix**: Introduced a 100ms start delay to fix clipped initial syllables in Chromium-based browsers.
- **ID Synchronization**: Fixed mismatch between HTML ID and state manager for the TTS toggle.
- **Gender-Detection Fix**: Corrected role name normalization in `utils.js` which was incorrectly removing female suffixes.

### Changed

- **UI Feedback**: The Auto-Speak toggle now immediately triggers the briefing to confirm functionality to the user.
- **Browser Recommendation**: Added documentation regarding the benefits of Microsoft Edge (Natural Voices) in the README.

---

## [0.11.0] - 2026-04-22

### Added

- **Proxy Reference Implementation**: Added a complete `chat.php` template to the README as a reference to simplify server setup.
- **Enhanced Error Diagnosis**: The PHP proxy now returns detailed error messages (including `php_error` and `received_length`) to quickly identify JSON transmission issues.

### Changed

- **Server Path Structure**: Simplified the server path from `/browser/dialogue_lab/` to `/dialogue_lab/` and updated it in `config.js` and documentation.
- **Documentation Sync**: Fully synchronized the German and English sections of the README and updated them to reflect the current modular architecture.

### Fixed

- **CORS for Local Development**: Proxy headers now explicitly allow requests from `localhost` (including common ports like 5500), enabling testing without deployment.
- **JSON Payload Handling**: Fixed an issue where the proxy could not read the frontend's request body (switched to `php://input`).
- **Nginx Stability**: Corrected Nginx configuration for proper PHP file processing to prevent 404 errors during API calls.

---

## [0.10.1] - 2026-04-16

### Fixed

- **UI Reference Error**: Fixed a `ReferenceError` in `ui.js` where the function `renderBoldMarkdownWithLineBreaks` was called without the `Utils` module being correctly imported or referenced.

---

## [0.10.0] - 2026-04-15

### Added

- **Modern Chat UI**: Integrated custom CSS for a contemporary chat experience, including asymmetric message bubbles (`rounded-[22px]`), subtle glassmorphism effects (`backdrop-filter`), and a pulsating status indicator.
- **Enhanced Avatar System**: Implemented dynamic avatar styling, distinguishing between standard circular avatars and rectangular portrait avatars for female roles (based on "-in" suffix).
- **Mobile Input Optimization**: Added logic to automatically collapse the briefing section when the input field is focused on smaller screens, maximizing screen real estate for typing.
- **Consistent Input Field Sizing**: Standardized input field font size to `text-base` (16px) to prevent unwanted auto-zooming on iOS devices.

### Changed

- **Main Branch Alignment**: The application's design and logic have been standardized to the "Simulation Lab" version, making it the new default on the `main` branch.
- **Documentation Update**: `README.md` has been revised to remove references to "specialized versions" and now reflects the current main application's features and structure.
- **File Structure**: JavaScript files (`config.js`, `utils.js`, `api.js`, `ui.js`, `app.js`) have been moved into a dedicated `src/js/` subdirectory for better organization.
- **File Path References**: Updated all script references in `index.html` and file paths in `README.md` to reflect the new `src/js/` directory.

---

## [0.9.3] - 2026-04-14

### Fixed

- **Exercise Mode UX:** Resolved an issue where the input field and send button remained deactivated after the first exercise interaction.
- **UI State Logic:** Improved the flow in Exercise mode; the input field now stays disabled while exercise actions (Revise, Next Statement, Restart) are visible to prevent conflicting inputs.
- **Error Recovery:** Added logic to re-enable the input field specifically after API errors to allow users to retry their submission.

### Added

- **Action Handlers:** Implemented dedicated event listeners for "Revise" and "Restart" buttons to ensure the UI state (input focus and activation) is correctly restored.

### Changed

- **Documentation:** Updated README.md (EN/DE) to document the multi-branch deployment strategy and the subdirectory routing for partner-specific test branches.

---

## [0.9.2] - 2026-04-13

### Added

- **Multi-Branch CI/CD:** Implemented a fully automated GitHub Actions workflow that supports deploying every branch to GitHub Pages.
- **Dynamic Branch Routing:** Branches other than `main` are now automatically deployed into their own subdirectories (e.g., `.../exercises-only/`), enabling parallel testing of different features.
- **Deployment Provider:** `JamesIves/github-pages-deploy-action@v4` for more robust multi-folder deployment and cleaner workflow configuration.

---

## [0.9.1] - 2026-04-10

### Added

- **Dynamic Short Instructions:** Moved exercise-specific instruction strings (e.g., "Formuliere die Aussage konstruktiv um") from the source code into the `### META ###` block of scenario and instruction files using the `short_instruction` key.

### Changed

- **UI Consistency:** Synchronized the instruction text displayed in the main subtitle with the text shown in the initial chat bubble to prevent user confusion.
- **Data Architecture:** Updated `api.js` to parse the new metadata field and `app.js` to reactively update the UI based on the loaded exercise configuration.
- **Clean Code:** Removed the last remaining hardcoded German strings from the controller logic, making the application fully data-driven.

---

## [0.9.0] - 2026-04-10

### Added

- **Modular Architecture:** Split the monolithic `app.js` into specialized, namespaced modules: `api.js` (communication), `ui.js` (DOM/View), and `utils.js` (parsing/logic helpers) to improve maintainability and code clarity.
- **Centralized State Management:** Introduced a global `STATE` object in `app.js` to encapsulate chat history, configuration, and exercise progress, providing a "single source of truth" for the application.
- **Unified Initialization Helper:** Added `prepareModeSwitch` to standardize UI resets (clearing chat, scrolling to top, visibility toggles) when switching between modes.

### Changed

- **Stateless API Design:** Refactored `api.js` functions to be stateless; configuration values (URL, model, temperatures) are now passed as parameters from the controller (`app.js`), reducing hidden dependencies.
- **Decoupled Logic:** Moved heuristic role detection and complex text parsing from the controller to `utils.js`.
- **Orchestrated Data Flow:** `app.js` now acts strictly as a controller, orchestrating the flow between data services (`api.js`) and the user interface (`ui.js`).
- **Documentation Sync:** Fully updated `README.md` in both German and English to reflect the new modular structure, the dependency injection pattern, and the central role of `exercises.json`.

### Fixed

- **Global Scope Pollution:** Fixed issues where helper functions and variables were leaking into the global window object by using explicit namespacing (`window.UI`, `window.API`, etc.).
- **Reference Errors:** Resolved "assignment to undeclared variable" errors that occurred during the migration of global variables into the `STATE` object.
- **Race Conditions:** Improved initialization sequence to ensure `config.js` and `exercises.json` are fully processed before the UI starts interacting with modules.

---

## [0.8.0] - 2026-04-09

### Added

- **New Exercise Type:** Integrated "Positive Unterstellung" (Positive Assumption) into the Exercises mode, including dedicated statements, instructions, and trainer prompts.

### Changed

- **Mode Renaming:** Renamed "Gesprächstraining" to **Simulationen** (Simulations) and "Ich-Botschaften" to **Übungen** (Exercises) to better reflect the broader range of available content.
- **Layout Architecture:** Switched to a unified scroll layout where the main container (Briefing and Chat) scrolls as a single unit while the input area remains fixed at the bottom. This eliminates nested scrollbars for a better user experience.
- **Briefing Visibility:** Updated both modes to show the briefing expanded by default, ensuring immediate access to task instructions without hiding the first chat message.
- **Enhanced Scroll Logic:** Improved message appending to support conditional scrolling; the view now stays at the top when a new exercise loads but scrolls automatically during active conversation.
- **Refactored Mode Switching:** Made mode and scenario transitions more robust by properly awaiting asynchronous dropdown population and metadata loading.

### Fixed

- **Z-Index Hierarchy:** Corrected z-index values in `index.html` to ensure modals (Feedback/Reset) always appear above the sidebar and mobile overlays.
- **Scenario Dropdown Synchronization:** Fixed a bug where the scenario list wouldn't update correctly or fail to load the initial briefing when switching between Simulation and Exercise modes.
- **Layout Regressions:** Resolved issues where the input field was incorrectly positioned or covered by chat content on certain screen sizes.
- **Message Styling:** Fixed a logic error in `appendMessage` to ensure "Task" and "Feedback" bubbles in Exercise mode receive the correct visual styling and labels.
- **Mobile Sidebar Interaction:** Ensured the mobile menu closes automatically when opening modals to prevent UI overlapping.
- **Initialization Race Conditions:** Patched several async/await gaps in `app.js` that caused intermittent "Configuration not found" or "File not found" errors during rapid mode switching.

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
