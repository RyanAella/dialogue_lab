/**
 * Global application configuration.
 * Centralizes API endpoints, AI model parameters, and data file paths.
 */
export const APP_CONFIG = {
  /** URL of the server-side proxy used to securely call the OpenAI API */
  PROXY_URL: "https://kite2.site/dialogue_lab/chat.php",

  /** The specific OpenAI LLM model used for all interactions */
  MODEL: "gpt-4o",

  /** Sampling temperature for transformation exercises (e.g., I-Messages, Positive Assumption) */
  ICH_BOTSCHAFT_TEMPERATURE: 0.4,

  /** Path to the master JSON file containing exercise definitions */
  EXERCISES_FILE: "src/data/exercises.json",
};
