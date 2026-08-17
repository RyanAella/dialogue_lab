/**
 * @module EventListeners
 * Centralized event listener management for the Dialogue Lab application.
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_MODES } from "../core/config.js";
import { switchToSimulationMode } from "../core/modeManager.js";
import { handleFeedback, closeFeedbackModal } from "../features/feedback.js";
import { downloadCurrentTranscript } from "../features/export.js";
import { STATE } from "../core/state.js";
import { handleSend, handleNextExercise } from "./messageHandlers.js";

/**
 * Registers all event listeners for core UI interactions.
 * @param {Object} handlers - Object containing handler functions
 * @param {Function} handlers.switchToTransformationMode - Transformation mode handler
 * @param {Function} handlers.switchToRoleplayMode - Roleplay mode handler
 * @param {Function} handlers.loadContent - Content loading handler
 */
export function setupEventListeners(handlers) {
  const {
    switchToTransformationMode,
    switchToRoleplayMode,
    switchToSimulationMode,
    loadContent
  } = handlers;

  // Mode Selector
  UI.elements.modeSelect?.addEventListener("change", async (e) => {
    await DataLogger.endConversation();

    if (e.target.value === APP_MODES.TRANSFORMATION) {
      await switchToTransformationMode();
    } else if (e.target.value === APP_MODES.SIMULATION) {
      await switchToSimulationMode();
    } else {
      await switchToRoleplayMode();
    }
  });

  // Scenario Selector
  UI.elements.scenarioSelect.addEventListener("change", async (e) => {
    await DataLogger.endConversation();
    await loadContent(e.target.value);
  });

  // Exercise Selector
  UI.elements.exerciseSelect?.addEventListener("change", async (e) => {
    await DataLogger.endConversation();
    await loadContent(e.target.value);
  });

  // Input validation for send button
  UI.elements.userInput.addEventListener("input", () => {
    UI.updateInputUI(UI.elements.userInput.disabled);
  });

  // Send Button
  UI.elements.sendBtn.addEventListener("click", handleSend);
  UI.elements.userInput.addEventListener("keypress", (e) => e.key === "Enter" && handleSend());

  // Next Exercise Button
  UI.elements.nextTaskBtn?.addEventListener("click", handleNextExercise);

  // Feedback Button
  UI.elements.feedbackBtn?.addEventListener("click", handleFeedback);

  // Export Buttons
  UI.elements.exportTranscriptBtn?.addEventListener("click", downloadCurrentTranscript);
  UI.elements.modalDownloadBtn?.addEventListener("click", downloadCurrentTranscript);

  // Modal close buttons
  UI.elements.modalCloseFeedback?.addEventListener("click", closeFeedbackModal);
  UI.elements.modalCloseReset?.addEventListener("click", window.closeResetModal);
  document.getElementById("modal-confirm-reset")?.addEventListener("click", window.closeResetModal);
  document.getElementById("feedback-new-conversation")?.addEventListener("click", closeFeedbackModal);

  // Sidebar Reset Button
  UI.elements.resetBtn?.addEventListener("click", async () => {
    await DataLogger.endConversation();
    UI.openResetModal();
  });

  // Briefing Header Toggle
  UI.elements.briefingHeader.addEventListener("click", () => {
    const h = UI.elements.briefingContent.classList.toggle("hidden");
    UI.elements.chevron.style.transform = h ? "rotate(-90deg)" : "rotate(0deg)";
  });

  // Mobile Menu
  UI.elements.mobileMenuBtn?.addEventListener("click", () => UI.toggleMobileMenu());
  UI.elements.sidebarOverlay?.addEventListener("click", () => UI.toggleMobileMenu(true));

  // Hide briefing on mobile input focus
  UI.elements.userInput.addEventListener("focus", () =>
    window.innerWidth < 1024 && UI.elements.briefingContent.classList.add("hidden")
  );

  // TTS Toggle
  setupTtsToggle();
}

/**
 * Sets up the Text-to-Speech toggle event listener.
 * Handles auto-speak state changes and immediate briefing playback.
 */
function setupTtsToggle() {
  const ttsToggle = UI.elements.autoSpeakToggle;
  if (!ttsToggle) return;

  STATE.ttsEnabled = ttsToggle.checked;
  ttsToggle.addEventListener("change", (e) => {
    STATE.ttsEnabled = e.target.checked;

    if (STATE.ttsEnabled) {
      const briefing = UI.elements.briefingContent.innerText;
      if (briefing && !UI.elements.briefingContent.classList.contains("hidden")) {
        UI.speak(briefing, "Briefing");
      }
    } else {
      window.speechSynthesis.cancel();
    }
  });
}
