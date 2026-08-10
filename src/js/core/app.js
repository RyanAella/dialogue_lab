import { DataLogger } from "../services/dataLogger.js";
import { APP_CONFIG, UI_TEXTS } from "./config.js";
import "../ui/windowHandlers.js";
import {UI} from "../ui/ui.js";
import { handleSend, handleNextExercise } from "../utils/messageHandlers.js";
import { setupEventListeners } from "../utils/eventListeners.js";
import { loadContent } from "../services/contentLoader.js";
import {
  loadExercises,
  initializeCurrentMode
} from "./modeManager.js";

/**
 * @module App
 * Main controller for the Dialogue Lab application.
 * Orchestrates state management, scenario loading, and user interactions.
 */

/**
 * Orchestrates the application startup sequence.
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
    loadContent
  });
  await initializeCurrentMode();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await startApp();
  } catch (error) {
    console.error("Critical initialization error:", error);
    UI.updateStatus("error", UI_TEXTS.errors.initializationError);
  }
});

// Make key functions globally available for export.js and onclick attributes in index.html
window.handleNextExercise = handleNextExercise;
window.handleSend = handleSend;
window.loadContent = loadContent;