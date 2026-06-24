import { API } from "./api.js";
import { APP_CONFIG } from "./config.js";
import { Utils } from "./utils.js";

/**
 * @module ScenarioService
 * Service for managing exercise data and scenario configurations.
 * Handles loading the exercise pool and managing the active scenario state.
 */
export const ScenarioService = {
  /**
   * Internal storage for the exercise pool.
   * @type {Array<Object>}
   * @private
   */
  _exercises: [],

  /**
   * The currently active scenario and its computed metadata.
   * @type {Object|null}
   * @private
   */
  _active: null,

  /**
   * Loads the exercise pool from the server.
   * Appends a timestamp to the URL to prevent browser caching.
   * @async
   * @returns {Promise<Array<Object>>} The list of loaded exercises.
   * @throws {Error} If the network request fails or the response is invalid.
   */
  async loadPool() {
    const url = `${APP_CONFIG.EXERCISES_FILE}?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Exercises could not be loaded");

    this._exercises = await response.json();
    return this._exercises;
  },

  /**
   * Filters the internal exercise pool by its type.
   * @param {string} type - The exercise category to filter by (e.g., 'SIMULATION').
   * @returns {Array<Object>} A list of matching exercises.
   */
  getExercisesByType(type) {
    return this._exercises.filter((ex) => ex.type === type);
  },

  /**
   * Fetches the full scenario configuration and associated prompts for a given ID.
   * Enriches the data with computed metadata like role names.
   * @async
   * @param {string} id - The unique identifier for the exercise.
   * @returns {Promise<Object>} The enriched scenario configuration.
   * @throws {Error} If the exercise ID is not found in the pool.
   */
  async loadScenario(id) {
    const exercise = this._exercises.find((ex) => ex.id === id);
    if (!exercise) throw new Error(`Exercise ${id} not found`);

    const data = await API.fetchCompleteScenario(exercise.config.scenarioFile);

    // Compute additional metadata for the active session
    this._active = {
      ...data,
      roleName: Utils.extractRoleName(data.instructionSection, data.roleLabel),
      shortInstruction: data.shortInstruction || "Bearbeite die Aussage.",
    };

    return this._active;
  },

  /**
   * Retrieves the currently active scenario state.
   * @returns {Object|null} The active scenario object or null if none is loaded.
   */
  getActive() {
    return this._active;
  },

  /**
   * Returns the entire exercise pool.
   * @returns {Array<Object>}
   */
  getAll() {
    return this._exercises;
  },
};
