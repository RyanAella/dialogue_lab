/**
 * @module EventListeners
 * Centralized event listener management for the Dialogue Lab application.
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_MODES, EXERCISE_TYPES, UI_TEXTS } from "../core/config.js";
import { switchToSimulationMode, switchToTransformationMode } from "../core/modeManager.js";
import { ScenarioService } from "../features/scenario.js";
import { handleFeedback, closeFeedbackModal } from "../features/feedback.js";
import { downloadCurrentTranscript } from "../features/export.js";
import { STATE } from "../core/state.js";
import { handleSend, handleNextExercise } from "./messageHandlers.js";
import { CURRENT_VARIANT } from "../core/variants.js";
import { initExerciseDropdown, initDropdown } from "../utils/dropdowns.js";
import { loadContent } from "../services/contentLoader.js";

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

  // Scenario Selector - for default variant, mode selector
  UI.elements.scenarioSelect.addEventListener("change", async (e) => {
    await DataLogger.endConversation();
    
    // For default variant: mode selector - update exercise dropdown based on mode
    if (CURRENT_VARIANT.id === 'default' && CURRENT_VARIANT.modes.length > 1) {
      const selectedMode = e.target.value;
      const active = ScenarioService.getActive();
      const previousId = (active && active.type === (selectedMode === "SIMULATION" ? EXERCISE_TYPES.SIMULATION : EXERCISE_TYPES.TRANSFORMATION)) ? active.id : null;
      
      if (selectedMode === "SIMULATION") {
        STATE.currentMode = APP_MODES.SIMULATION;
        UI.setModeBadge(APP_MODES.SIMULATION);
        UI.updateSidebarVisibility(APP_MODES.SIMULATION);
        
        const simulationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.SIMULATION);
        const selectedId = simulationExercises.length > 0 
          ? (simulationExercises.some(ex => ex.id === previousId) ? previousId : simulationExercises[0].id)
          : null;
        
        await initDropdown(EXERCISE_TYPES.SIMULATION, UI.elements.exerciseSelect, UI_TEXTS.input.chooseExercise, selectedId);
        UI.updateInputUI(true, UI_TEXTS.input.chooseScenario);
        document.getElementById("main-subtitle").textContent = UI_TEXTS.subtitles.roleplay;
        
        // Load the selected content directly
        if (selectedId) {
          await loadContent(selectedId);
        }
      } else if (selectedMode === "TRANSFORMATION") {
        STATE.currentMode = APP_MODES.TRANSFORMATION;
        UI.setModeBadge(APP_MODES.TRANSFORMATION);
        UI.updateSidebarVisibility(APP_MODES.TRANSFORMATION);
        
        const transformationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.TRANSFORMATION);
        const selectedId = transformationExercises.length > 0 
          ? (transformationExercises.some(ex => ex.id === previousId) ? previousId : transformationExercises[0].id)
          : null;
        
        await initDropdown(EXERCISE_TYPES.TRANSFORMATION, UI.elements.exerciseSelect, UI_TEXTS.input.chooseExercise, selectedId);
        UI.updateInputUI(true, UI_TEXTS.input.chooseExercise);
        document.getElementById("main-subtitle").textContent = "Wähle eine Übung aus, um zu starten.";
        
        // Load the selected content directly
        if (selectedId) {
          await loadContent(selectedId);
        }
      }
      return;
    }
    
    // For other variants: load content directly
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
