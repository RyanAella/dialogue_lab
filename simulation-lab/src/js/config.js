/**
 * Global application configuration.
 * Centralizes API endpoints, AI model parameters, and data file paths.
 */
export const APP_CONFIG = {
  PROXY_URL: "https://kite2.site/chat.php",
  MODEL: "gpt-4o",
  CHAT_TEMPERATURE: 0.7,
  MENTOR_TEMPERATURE: 0.3,
  EXERCISES_FILE: "src/data/exercises.json",
};
