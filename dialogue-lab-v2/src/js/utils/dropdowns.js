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
 * @param {string} [selectedId=null] - Optional ID of the exercise to pre-select.
 */
export async function initDropdown(type, selectElement, placeholder, selectedId = null) {
  if (!selectElement) return;

  selectElement.innerHTML = `<option value="" disabled>${placeholder}</option>`;
  
  // Use filtered exercises from ScenarioService instead of filtering by type
  const exercises = ScenarioService._exercises || [];

  if (exercises.length === 0) {
    selectElement.innerHTML = `<option value="" disabled>${UI_TEXTS.errors.noEntriesAvailable}</option>`;
    selectElement.disabled = true;
    return;
  }

  let hasOptions = false;
  let firstOptionId = null;
  
  for (const ex of exercises) {
    // Only include exercises of the requested type
    if (ex.type !== type) continue;
    
    try {
      const filePath = ex.config.scenarioFile || ex.config.instructionFile;
      const title = (await API.fetchScenarioTitle(filePath)) || ex.id;
      const isSelected = ex.id === selectedId;
      selectElement.add(new Option(title, ex.id, false, isSelected));
      if (!hasOptions) {
        firstOptionId = ex.id;
        hasOptions = true;
      }
    } catch (e) {
      console.error(`Metadata load error for ${ex.id}:`, e);
    }
  }
  
  // If a selectedId was provided and we have options, ensure it's selected
  if (selectedId && hasOptions) {
    selectElement.value = selectedId;
  } else if (hasOptions && !selectedId) {
    // If no selectedId provided but we have options, select the first one
    selectElement.value = firstOptionId;
  }
  
  selectElement.disabled = false;
}

/**
 * Initializes the simulation scenario dropdown.
 * @async
 * @param {string} [selectedId=null] - Optional ID of the exercise to pre-select.
 */
export async function initScenarioDropdown(selectedId = null) {
  await initDropdown(
    EXERCISE_TYPES.SIMULATION,
    UI.elements.scenarioSelect,
    UI_TEXTS.input.chooseScenario,
    selectedId
  );
}

/**
 * Initializes the transformation exercise dropdown.
 * @async
 * @param {string} [selectedId=null] - Optional ID of the exercise to pre-select.
 */
export async function initExerciseDropdown(selectedId = null) {
  await initDropdown(
    EXERCISE_TYPES.TRANSFORMATION,
    UI.elements.exerciseSelect,
    UI_TEXTS.input.chooseExercise,
    selectedId
  );
}

/**
 * Initializes mode selector dropdown for default variant
 * Shows mode options (Simulation, Transformation) instead of exercises
 */
export async function initModeSelectorDropdown() {
  const selectElement = UI.elements.scenarioSelect;
  if (!selectElement) return;
  
  selectElement.innerHTML = `<option value="" disabled>${UI_TEXTS.input.chooseScenario}</option>`;
  selectElement.add(new Option("Simulation", "SIMULATION", false, true));
  selectElement.add(new Option("Transformation", "TRANSFORMATION"));
  selectElement.disabled = false;
}


