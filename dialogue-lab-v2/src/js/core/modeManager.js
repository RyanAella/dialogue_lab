/**
 * @module ModeManager
 * Handles mode switching and mode-specific state management.
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_MODES, EXERCISE_TYPES, UI_TEXTS } from "./config.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE, resetState, resetUI, resetSidebarButtons } from "./state.js";
import { appendPartnerMessage, updateInputAndStatus, showBriefingError } from "../ui/uiHelpers.js";
import { initScenarioDropdown, initExerciseDropdown, initModeSelectorDropdown, initDropdown } from "../utils/dropdowns.js";
import { getTransformationProgressText } from "../utils/messageHandlers.js";
import { CURRENT_VARIANT } from "./variants.js";
import { loadContent } from "../services/contentLoader.js";

/**
 * Resets the application state and UI when switching between different modes or scenarios.
 * Prepares the sidebar buttons, clears chat history, and resets local indices.
 *
 * @param {string} mode - The mode to initialize (APP_MODES.ROLEPLAY or APP_MODES.TRANSFORMATION).
 * @returns {void}
 */
export function resetAppForMode(mode) {
  STATE.currentMode = mode;
  if (UI.elements.modeSelect) UI.elements.modeSelect.value = mode;

  resetState();
  resetUI();

  UI.elements.chatWindow.closest("main")?.scrollTo(0, 0);
  UI.elements.briefingContent.classList.remove("hidden");
  UI.setBriefingExpanded(true);
  UI.updateSidebarVisibility(mode);
  UI.setModeBadge(mode);

  const isTransform = mode === APP_MODES.TRANSFORMATION;
  resetSidebarButtons();
  
  if (UI.elements.feedbackBtn) {
    UI.elements.feedbackBtn.innerHTML = isTransform
      ? UI_TEXTS.feedbackBtn.transformation
      : UI_TEXTS.feedbackBtn.roleplay;
  }
}

/**
 * Fetches the initial exercise catalog from the server using the ScenarioService.
 * Populates the internal exercise pool or displays an error in the UI on failure.
 *
 * @async
 */
export async function loadExercises() {
  try {
    await ScenarioService.loadPool();
  } catch (error) {
    UI.updateStatus("error", `${UI_TEXTS.errors.prefix} ${error.message}`);
    showBriefingError(`${UI_TEXTS.errors.prefix} ${error.message}`);
  }
}

/**
 * Configures the application for Roleplay mode.
 * Populates scenario dropdowns and activates the default or previously selected simulation.
 *
 * @async
 */
export async function switchToRoleplayMode() {
  const active = ScenarioService.getActive();
  const previousId = (active && active.type === EXERCISE_TYPES.SIMULATION) ? active.id : null;

  await DataLogger.endConversation();

  resetAppForMode(APP_MODES.ROLEPLAY);
  UI.updateInputUI(true, UI_TEXTS.input.chooseScenario);

  const simulationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.SIMULATION);
  const selectedId = simulationExercises.length > 0 
    ? (simulationExercises.some(ex => ex.id === previousId) ? previousId : simulationExercises[0].id)
    : null;

  await initScenarioDropdown(selectedId);
  
  // Load the selected content directly
  if (selectedId) {
    await loadContent(selectedId);
  } else {
    UI.updateStatus("idle", UI_TEXTS.errors.noSimulations);
  }

  document.getElementById("main-subtitle").textContent = UI_TEXTS.subtitles.roleplay;
  updateInputAndStatus(true, UI_TEXTS.input.chooseScenario, "idle", UI_TEXTS.status.roleplayActive);
}

/**
 * Configures the application for Simulation mode.
 * Populates scenario dropdowns and activates the default or previously selected simulation.
 *
 * @async
 */
export async function switchToSimulationMode() {
  const active = ScenarioService.getActive();
  const previousId = (active && active.type === EXERCISE_TYPES.SIMULATION) ? active.id : null;

  await DataLogger.endConversation();

  resetAppForMode(APP_MODES.SIMULATION);
  UI.updateInputUI(true, UI_TEXTS.input.chooseScenario);

  const simulationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.SIMULATION);
  const selectedId = simulationExercises.length > 0 
    ? (simulationExercises.some(ex => ex.id === previousId) ? previousId : simulationExercises[0].id)
    : null;

  await initScenarioDropdown(selectedId);
  
  // Load the selected content directly
  if (selectedId) {
    await loadContent(selectedId);
  } else {
    UI.updateStatus("idle", UI_TEXTS.errors.noSimulations);
  }

  document.getElementById("main-subtitle").textContent = UI_TEXTS.subtitles.roleplay;
  updateInputAndStatus(true, UI_TEXTS.input.chooseScenario, "idle", UI_TEXTS.status.simulationActive);
}

/**
 * Configures the application for Transformation mode.
 * Populates exercise dropdowns and loads the specified or default exercise.
 *
 * @async
 * @param {string} [exerciseId="ich_botschaften_basis"] - The ID of the exercise to activate.
 */
export async function switchToTransformationMode(exerciseId = "ich_botschaften_basis") {
  await DataLogger.endConversation();
  resetAppForMode(APP_MODES.TRANSFORMATION);
  updateInputAndStatus(true, UI_TEXTS.input.chooseExercise, "idle", UI_TEXTS.status.transformationActive);

  const transformationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.TRANSFORMATION);
  const selectedId = transformationExercises.length > 0 
    ? (exerciseId || transformationExercises[0].id)
    : null;

  await initExerciseDropdown(selectedId);
  
  // Load the selected content directly
  if (selectedId) {
    await loadContent(selectedId);
  } else {
    updateInputAndStatus(true, UI_TEXTS.errors.noExercises, "idle", UI_TEXTS.errors.noTransformations);
  }
}

/**
 * Initializes the current mode based on STATE.currentMode or variant modes.
 * If variant has specific modes, uses the first one as default.
 * This ensures each variant starts with its appropriate mode.
 *
 * @async
 */
export async function initializeCurrentMode() {
  // For default variant with both modes: mode selector + simulation exercises
  if (CURRENT_VARIANT.id === 'default' && CURRENT_VARIANT.modes.length > 1) {
    await initModeSelectorDropdown();
    
    // Get first simulation exercise to pre-select
    const simulationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.SIMULATION);
    const firstSimulationId = simulationExercises.length > 0 ? simulationExercises[0].id : null;
    
    await initDropdown(EXERCISE_TYPES.SIMULATION, UI.elements.exerciseSelect, UI_TEXTS.input.chooseExercise, firstSimulationId);
    
    // Set initial mode to first mode in variant
    if (CURRENT_VARIANT.modes && CURRENT_VARIANT.modes.length > 0) {
      STATE.currentMode = CURRENT_VARIANT.modes[0];
    }
    UI.setModeBadge(STATE.currentMode);
    UI.updateSidebarVisibility(STATE.currentMode);
    UI.updateInputUI(true, UI_TEXTS.input.chooseScenario);
    document.getElementById("main-subtitle").textContent = UI_TEXTS.subtitles.roleplay;
    updateInputAndStatus(true, UI_TEXTS.input.chooseScenario, "idle", UI_TEXTS.status.simulationActive);
    
    // Trigger the initial content load for the first selected exercise
    if (firstSimulationId) {
      await loadContent(firstSimulationId);
    }
    
    return;
  }
  
  // Set STATE.currentMode based on variant's first mode if variant defines modes
  if (CURRENT_VARIANT.modes && CURRENT_VARIANT.modes.length > 0) {
    STATE.currentMode = CURRENT_VARIANT.modes[0];
  }
  
  // Then call the appropriate mode function based on STATE.currentMode
  if (STATE.currentMode === APP_MODES.TRANSFORMATION) {
    await switchToTransformationMode();
  } else if (STATE.currentMode === APP_MODES.SIMULATION) {
    await switchToSimulationMode();
  }
}

/**
 * Resets the current transformation session.
 * Re-shuffles statements, clears the local history, and restarts the progression
 * from the first task.
 * @returns {void}
 */
export function restartTransformationExercise() {
  if (STATE.currentMode !== APP_MODES.TRANSFORMATION) return;

  resetState();
  STATE.activeStatements = ScenarioService.getStatements(true);

  resetUI();
  resetSidebarButtons();

  if (UI.elements.feedbackBtn) {
    UI.elements.feedbackBtn.innerHTML = UI_TEXTS.feedbackBtn.transformation;
  }

  const config = ScenarioService.getActive();
  if (!config) return;

  const statement = STATE.activeStatements[STATE.exerciseIndex];
  if (!statement) return;

  const taskText = `"${statement}"\n\n${config.shortInstruction}`;

  appendPartnerMessage(taskText, config);
  if (STATE.ttsEnabled) UI.speak(taskText, config.roleName);
  UI.updateInputUI(false, UI_TEXTS.input.transformationRestart);
  UI.updateStatus("idle", `${getTransformationProgressText()} (${UI_TEXTS.status.restarting})`);
}
