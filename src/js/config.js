/**
 * @module Config
 * Centralized configuration settings for the Dialogue Lab application.
 * This file manages API endpoints, model parameters, and static resource paths.
 */

/**
 * Global application configuration object.
 * @type {Object}
 * @property {string} PROXY_URL - The destination endpoint for the server-side API proxy.
 * @property {string} MODEL - The identifier for the OpenAI model used (e.g., 'gpt-4o').
 * @property {number} CHAT_TEMPERATURE - Controls randomness in the AI partner's dialogue (0.0 to 1.0).
 * @property {number} COACH_TEMPERATURE - Controls randomness in the AI coach's analysis (lower for more consistency).
 * @property {string} EXERCISES_FILE - Relative path to the JSON file containing the exercise pool.
 */
export const APP_CONFIG = {
  PROXY_URL: "https://kite2.site/dialogue_lab/chat.php",
  DATALOGGER_BACKEND: "https://kite2.site/dialogue_lab/save_dialogue.php",
  MODEL: "gpt-4o",
  CHAT_TEMPERATURE: 0.7,
  COACH_TEMPERATURE: 0.3,
  ICH_BOTSCHAFT_TEMPERATURE: 0.4,
  EXERCISES_FILE: "src/data/exercises.json",
  FALLBACK_PROMPTS: {
    transformation: "Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen des Nutzers kritisch und gib konstruktives Feedback.",
    simulation: "Du bist ein Mentor. Analysiere das Gesprächsprotokoll und gib hilfreiches Feedback."
  }
};
