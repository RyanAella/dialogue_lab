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
   * Pool for transformation statements.
   * @type {string[]}
   * @private
   */
  _statements: [],

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

    const isTransform = exercise.type === "TRANSFORMATION";
    const filePath = isTransform
      ? exercise.config.instructionFile
      : exercise.config.scenarioFile;

    const data = await API.fetchCompleteScenario(filePath);

    // Compute additional metadata for the active session
    this._active = {
      ...data,
      id: exercise.id,
      type: exercise.type,
      roleName: isTransform
        ? data.roleLabel || "Trainer"
        : Utils.extractRoleName(data.instructionSection, data.roleLabel),
      shortInstruction: data.shortInstruction || "Bearbeite die Aussage.",
    };

    // Load additional statements if it's a transformation exercise
    if (isTransform && exercise.config.sourceFile) {
      const resp = await fetch(`${exercise.config.sourceFile}?t=${Date.now()}`);
      const text = await resp.text();
      this._statements = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
    }

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

  /**
   * Returns the statements for the active transformation exercise.
   * @param {boolean} [shuffled=false] - Whether to return a shuffled copy.
   * @returns {string[]}
   */
  getStatements(shuffled = false) {
    return shuffled
      ? Utils.shuffleArray(this._statements)
      : [...this._statements];
  },

  /**
   * Resets the active scenario state.
   */
  clearActive() {
    this._active = null;
    this._statements = [];
  },
};
