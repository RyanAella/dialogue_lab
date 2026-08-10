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
import { initExerciseDropdown } from "../utils/dropdowns.js";
import { getTransformationProgressText } from "../utils/messageHandlers.js";

/**
 * Resets the application state and UI for transformation mode.
 * Prepares the sidebar buttons, clears chat history, and resets local indices.
 *
 * @returns {void}
 */
export function resetAppForMode() {
    STATE.currentMode = APP_MODES.TRANSFORMATION;

    resetState();
    resetUI();

    UI.elements.chatWindow?.closest("main")?.scrollTo(0, 0);
    UI.elements.briefingContent?.classList.remove("hidden");
    UI.setBriefingExpanded(true);
    UI.updateSidebarVisibility(APP_MODES.TRANSFORMATION);
    UI.setModeBadge(APP_MODES.TRANSFORMATION);

    resetSidebarButtons();

    if (UI.elements.feedbackBtn) {
        UI.elements.feedbackBtn.innerHTML = UI_TEXTS.feedbackBtn.transformation
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

    await initExerciseDropdown();

    const transformationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.TRANSFORMATION);
    if (transformationExercises.length > 0) {
        if (UI.elements.exerciseSelect) {
            UI.elements.exerciseSelect.value = exerciseId || transformationExercises[0].id;
            UI.elements.exerciseSelect.dispatchEvent(new Event("change"));
        }
    } else {
        updateInputAndStatus(true, UI_TEXTS.errors.noExercises, "idle", UI_TEXTS.errors.noExercises);
    }
}

/**
 * Initializes the transformation mode.
 *
 * @async
 */
export async function initializeCurrentMode() {
    await switchToTransformationMode();
}

/**
 * Resets the current transformation session.
 * Re-shuffles statements, clears the local history, and restarts the progression
 * from the first task.
 * @returns {void}
 */
export function restartTransformationExercise() {
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