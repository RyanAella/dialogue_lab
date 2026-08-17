import {API} from "../services/api.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_CONFIG, APP_MODES, EXERCISE_TYPES, UI_TEXTS, PROMPT_TEMPLATES } from "../core/config.js";
import "../ui/windowHandlers.js";
import {getProfilePool} from "../features/profiles.js";
import {ScenarioService} from "../features/scenario.js";
import {UI} from "../ui/ui.js";
import {Utils} from "../utils/utils.js";
import { handleFeedback, closeFeedbackModal } from "../features/feedback.js";
import { downloadCurrentTranscript } from "../features/export.js";
import { STATE } from "../core/state.js";
import { handleSend, handleNextExercise } from "../utils/messageHandlers.js";
import { appendPartnerMessage, updateInputAndStatus, showBriefingError } from "../ui/uiHelpers.js";
import { setupEventListeners } from "../utils/eventListeners.js";
import { initScenarioDropdown, initExerciseDropdown } from "../utils/dropdowns.js";
import { loadContent } from "../services/contentLoader.js";
import {
  resetAppForMode,
  loadExercises,
  switchToRoleplayMode,
  switchToSimulationMode,
  switchToTransformationMode,
  initializeCurrentMode,
  restartTransformationExercise
} from "../core/modeManager.js";
import { initResearcherMenu } from "../features/researcherMenu.js";

/**
 * @module App
 * Main controller for the Dialogue Lab application.
 * Orchestrates state management, scenario loading, and user interactions.
 */

/**
 * 1. Loads exercises.
 * 2. Initializes UI.
 * 3. Binds events.
 * 4. Sets initial mode.
 */
async function startApp() {
  DataLogger.setBackendEndpoint(APP_CONFIG.DATALOGGER_BACKEND);
  DataLogger.setAutoUpload(true);
  DataLogger.init();

  await loadExercises();
  await UI.init();
  setupEventListeners({
    switchToTransformationMode,
    switchToRoleplayMode,
    switchToSimulationMode,
    loadContent
  });
  await initializeCurrentMode();
  initResearcherMenu();
}

// Initialization on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await startApp();
  } catch (error) {
    console.error("Critical initialization error:", error);
    UI.updateStatus("error", UI_TEXTS.errors.initializationError);
  }
});

// Make key functions globally available for export.js and onclick attributes in index.html
window.restartTransformationExercise = restartTransformationExercise;
window.switchToRoleplayMode = switchToRoleplayMode;
window.switchToTransformationMode = switchToTransformationMode;
window.handleNextExercise = handleNextExercise;
window.handleSend = handleSend;
window.loadContent = loadContent;
