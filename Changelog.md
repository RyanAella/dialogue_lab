# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.29.1] - 2026-07-24

### Fixed
- **Avatar Display Bug**: Fixed oversized character display in chat messages and main portrait containers by adding `relative` positioning class to all avatar containers (`ui.js` and `index.html`), ensuring absolute-positioned avatar layers correctly reference their parent container instead of the viewport.

---

## [0.26.0] - 2026-07-10

### Improved
- **Code Quality & Type Safety**: Added comprehensive JSDoc annotations across all ES6 modules to resolve IDE warnings and improve type-checking accuracy.
- **Refactored DOM Binding**: Standardized the `_bindElements` logic in `ui.js` to automatically map kebab-case IDs to camelCase properties, reducing boilerplate and potential reference errors.
- **Robust State Initialization**: Refined the initialization of `Avatar` and `Speech` states, including explicit type casting for null-state resets to satisfy strict linting rules.
- **Cleaned Architecture**: Performed a general cleanup of internal module communication, ensuring a more consistent data flow between `ScenarioService`, `API`, and `UI`.
- **Enhanced Error Handling**: Standardized error reporting in `api.js` to provide more descriptive logs for network failures and aborted requests.

### Fixed
- **Linting Warnings**: Resolved various "possibly null" or "undefined" warnings by implementing safer object checks and standardized JSDoc `@typedef` definitions.
- **Resource Tracking**: Fixed potential memory leaks in `speech.js` by ensuring `_lastSpokenText` and synthesis references are properly cleared during resets.
- **Consistency Fixes**: Aligned internal variable naming conventions across `app.js` and `ui.js` to match the new modular structure.

---

## [0.25.0] - 2026-07-04

### Added

- **Persona Adherence Logic**: Implementation of a generic behavioral instruction (`roleAdherence`) that prevents the AI from proactively taking over the conversation or breaking character.

---

## [0.24.1] - 2026-06-30

### Fixed

- **UI Error**: Resolved a `TypeError` in `ui.js` caused by calling the `setAvatarTalking` method before it was defined in the object.

---

## [0.24.0] - 2026-06-29

### Changed

- **Role Refactoring**: Renamed the "Trainer" role to "Coach" across the application logic and character profile mappings to better align with the coaching context.

---

## [0.23.1] - 2026-06-26

### Fixed

- **CI/CD Deployment**: Fixed 404 errors on sub-version deployments by disabling the `clean` option in GitHub Actions, allowing multiple branch previews to coexist.

---

## [0.23.0] - 2026-06-26

### Changed
- **UI/UX Enhancement**: Repositioned the briefing toggle (chevron) to the left of the header text to improve discoverability.
- **Chevron Animation Logic**: Standardized and synchronized rotation to -90 degrees across `app.js` and `ui.js` to ensure a smooth, direct 90-degree animation when collapsing.

---

## [0.22.0] - 2026-06-24

### Changed

- **Asset Allocation Optimization**: Centralized head image references in `profiles.js` into shared constants (`SHARED_FEMALE_HEADS`, `SHARED_MALE_HEADS`) to eliminate redundancy and simplify maintenance.

### Removed

- **"Mother" Character Profile**: Removed the "Mutter" character and its specific assets from the female character pool.

---

## [0.21.0] - 2026-06-12

### Added

- **Asset Preloading**: Implemented `preloadProfile` in `avatar.js` to cache critical character layers before the first render, eliminating the visual "flicker" effect.
- **Slugify Utility**: Added a `slugify` helper in `utils.js` to ensure URL-safe and filesystem-compatible filenames for transcript exports.

### Changed

- **Unified Avatar Rendering**: Refactored the avatar stack to a class-based system using `.js-avatar-layer` and `data-layer` attributes, allowing synchronous updates of Desktop and Mobile views.
- **Default Mode**: Set "Simulation" (Roleplay) as the default starting mode for better user onboarding.
- **Asynchronous Bootstrapping**: Refactored `UI.init` and `Avatar.setup` to be fully asynchronous, ensuring assets and DOM elements are ready before interaction.

### Fixed

- **Ghosting Effect**: Reduced visibility of previous characters during scenario transitions by implementing a reset-before-preload sequence in `Avatar.setup`.
- **Initialization Syntax**: Fixed broken initialization logic in `app.js` that prevented the application from starting correctly.
- **Sync Issues**: Fixed inconsistent avatar states between mobile and desktop portraits.

---

## [0.20.0] - 2026-06-08

### Added

- **Service-Oriented Architecture**: Extracted core logic into standalone ES6 modules: `Avatar`, `Speech`, `Chat`, and `ScenarioService`.
- **JSDoc Standardization**: Implemented comprehensive English JSDoc comments across all core utility and service modules for better maintainability and IDE support.

### Changed

- **Controller Refactoring**: Simplified `app.js` and `ui.js` by delegating business logic, state management, and multimedia handling to specialized services.
- **Enhanced Utility Layer**: Added `downloadFile` helper and refined text-to-speech cleaning logic in `utils.js`.
- **Documentation Overhaul**: Completely updated the `README.md` to reflect the new modular structure and define clear responsibilities for each module.

### Fixed

- **State Management Consistency**: Resolved potential race conditions and synchronization issues by centralizing chat history and scenario state.

---

## [0.19.0] - 2026-05-26

### Added

- **Modular Avatar System**: Introduced `profiles.js` to manage character pools and multi-layered graphics (Base, Hair, Clothes, Hands, Glasses, Headset).
- **Dynamic Character Randomization**: Implemented a two-tier randomization logic that first selects a character base from a pool and then randomizes individual traits for maximum variety.
- **Skin Tone Consistency**: Added automatic skin tone detection from head assets (e.g., `_a.png`) to ensure matching hand graphics are selected.
- **Accessory Layers**: Added support for optional layers including glasses and headsets, positioned correctly within the avatar stack.
- **Portrait Focus Layout**: Implemented a 3:4 aspect ratio with `object-fit: cover` and `object-position: top` to focus on the character's upper body and face.
- **In-Memory Caching**: Implemented a Map-based caching system in `api.js` with TTL logic to reduce redundant network requests for prompt files.

### Changed

- **Refactored Asset Management**: Moved character configurations from `config.js` to a dedicated `profiles.js` for better maintainability.
- **Layered Chat Bubbles**: Updated the miniature avatars in the chat history to use the same layered rendering system as the main portrait for visual consistency.
- **Fallback Mechanism**: Improved the role-to-profile mapping to use a robust fallback to a default pool if no specific role match is found.

### Fixed

- **Broken Image Fallback**: Implemented a transparent pixel fallback for missing or empty optional layers (like glasses or headsets) to prevent broken image icons.
- **Portrait Scaling**: Fixed an issue where different head shapes caused inconsistent container sizes by standardizing the `avatar-stack` CSS.
- **Z-Index Layering**: Corrected the rendering order to ensure hair correctly overlaps headsets and glasses where appropriate.
- **Silent Abort**: Improved `api.js` to gracefully handle `AbortError` without triggering UI error states when requests are cancelled.
- **Prompt Refinement**: Fixed a typo in `reporting_partner_prompt.txt` ("Kritikgespräch") to ensure professional AI persona behavior.

---

## [0.17.0] - 2026-05-15

### Added

- **Typing Indicator**: Integrated a visual signal (`showTypingIndicator`) to notify users when the AI is generating a response, improving the interactive feel.
- **Dynamic Voice Selection**: Added `VOICE_KEYWORDS` and logic to prioritize high-quality "Neural" voices based on gender and role.
- **Browser-Specific TTS Hints**: Implemented status messages recommending optimal browsers (like Edge) for the best speech synthesis quality.

### Changed

- **Initialization Refactoring**: Moved event listener binding to a dedicated `setupEventListeners` function in `app.js` to ensure DOM elements are fully bound before interaction.
- **Project Specialization**: Refined the UI, labels, and documentation to focus exclusively on the "Gesprächstraining" (Simulation Lab) edition.
- **Heuristic Role Detection**: Enhanced `utils.js` with advanced role name extraction and normalization logic to better handle dynamic scenario briefings.
- **Request Management**: Integrated `AbortController` in `api.js` to automatically cancel stale chat requests and prevent race conditions.
- **API Caching**: Implemented a Map-based cache in `api.js` for prompts and scenarios to reduce redundant network requests and improve performance.
- **Documentation Alignment**: Fully synchronized and updated both German and English versions of `README.md`.

### Fixed

- **Initialization Race Conditions**: Resolved `TypeError` issues where DOM elements were accessed before the `UI.init()` binding process was complete.
- **TTS Clipping**: Improved the `speak` function with a cleaner delay mechanism and better text preprocessing to prevent clipped initial syllables.
- **ID Synchronization**: Fixed naming mismatches for the primary scenario dropdown between the HTML and the state manager.

---

## [0.13.0] - 2026-05-04

### Added

- **Speech-to-Text (STT)**: Integration of the native Web Speech API for voice input. Users can now speak their responses directly using a microphone icon.
- **Browser Compatibility Check**: Added logic to detect supported browsers. In unsupported browsers (such as Firefox), the feature is informatively disabled.

### Changed

- **UI Feedback**: The microphone button now provides visual feedback (pulsing red) during recording and uses tooltips/help cursors to clarify the lack of browser support.
- **Input Logic**: Extended the `updateInputUI` function to synchronize the microphone status consistently with the general input state and technical availability.

---

## [0.12.0] - 2026-04-24

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

## [0.11.1] - 2026-04-22

### Changed

- **Documentation Alignment:** Fully synchronized the German and English versions of the `README.md` across both Lab editions (Simulation & Transformation) to ensure content parity and structural symmetry.
- **Path Accuracy:** Updated file paths (e.g., `src/js/config.js`) in documentation to reflect the actual project structure.

### Fixed

- **README Clarity:** Added missing technical notes regarding the referencing of prompt files within the scenario configuration.
- **Proxy Documentation:** Re-integrated the PHP proxy reference implementation and the content maintenance section into the Simulation Lab documentation.

---

## [0.10.0] - 2026-04-15

### Changed

- **Specialization Focus:** Refocused the application logic and documentation on dialogue simulations, preparing the foundation for the "Simulation Lab" scope.
- **Input UI Refinement:** Mirrored the input area and send button styling from the Practice Edition, applying `rounded-xl` and shadows for a more modern appearance.
- **Performance Optimization:** Refactored scenario initialization to use parallel fetching (`Promise.all`), significantly reducing load times for exercise metadata.
- **Documentation Alignment:** Fully synchronized German and English versions of the `README.md` to ensure content parity and technical accuracy.
- **Deployment Examples:** Standardized branch deployment documentation to use `/simulation-lab/` as a consistent example path.
- **Sticky UI Refinement:** Enhanced the sticky status bar with a backdrop-blur effect for better readability during scrolling.

### Fixed

- **Startup Stability:** Resolved race conditions during application initialization to ensure a more reliable loading sequence.
- **Logic Consistency:** Corrected the chevron rotation logic and centralized all visual state transitions within the `UI` module.
- **Mobile UX:** Implemented 16px font sizes to prevent automatic browser zooming on iOS and added bottom padding for safe-area support on modern mobile devices.
- **Cache-Busting:** Standardized the cache-busting mechanism across all data-fetching modules to ensure users always see the latest scenario content and configurations.

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

---

## [0.2.0] - 2026-03-31

### Added

- Responsive subtitle texts that adapt to screen width (Desktop vs. Mobile).
- Automatically collapse the briefing on initial page load for a better overview.

### Changed

- Improved focus management: The input field automatically regains focus after sending a message.
- Optimized Mobile UX: The sidebar now closes automatically once a scenario is selected.
- Refined role detection logic: Better handling of German grammar patterns (e.g., converting dative plural forms like "Mitarbeitenden").

---

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
