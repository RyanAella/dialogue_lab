/**
 * @module Dropdowns
 * Handles dropdown initialization for scenarios and exercises.
 */

import { UI } from "../ui/ui.js";
import { API } from "../services/api.js";
import { ScenarioService } from "../features/scenario.js";
import { EXERCISE_TYPES, UI_TEXTS } from "../core/config.js";

/**
 * Generic helper to populate a <select> element with options from the exercise pool.
 * Fetches scenario titles asynchronously to display user-friendly names.
 *
 * @async
 * @param {string} type - The exercise type to filter by (EXERCISE_TYPES.SIMULATION or EXERCISE_TYPES.TRANSFORMATION).
 * @param {HTMLSelectElement} selectElement - The target dropdown element.
 * @param {string} placeholder - The default disabled option text.
 */
async function initDropdown(type, selectElement, placeholder) {
    if (!selectElement) return;

    selectElement.innerHTML = `<option value="" selected disabled>${placeholder}</option>`;
    const filtered = ScenarioService.getExercisesByType(type);

    if (filtered.length === 0) {
        selectElement.innerHTML = `<option value="" disabled>${UI_TEXTS.errors.noEntriesAvailable}</option>`;
        selectElement.disabled = true;
        return;
    }

    for (const ex of filtered) {
        try {
            const filePath = ex.config.scenarioFile || ex.config.instructionFile;
            const title = (await API.fetchScenarioTitle(filePath)) || ex.id;
            selectElement.add(new Option(title, ex.id));
        } catch (e) {
            console.error(`Metadata load error for ${ex.id}:", e);`)
        }
    }
    selectElement.disabled = false;
}

/**
 * Initializes the simulation scenario dropdown.
 * @async
 */
export async function initScenarioDropdown() {
    await initDropdown(
        EXERCISE_TYPES.SIMULATION,
        UI.elements.scenarioSelect,
        UI_TEXTS.input.chooseScenario,
    );
}