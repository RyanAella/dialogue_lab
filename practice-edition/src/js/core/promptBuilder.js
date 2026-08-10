/**
 * @module PromptBuilder
 * Centralized prompt management for the Dialogue Lab application.
 * Provides a single source of truth for all system prompt logic.
 */

import { Chat } from "../features/chat.js";
import { ABSOLUTE_RULES, MODE_PROMPTS, FALLBACK_PROMPTS } from "../../data/promptRules.js";

/**
 * Prompt templates for generating user-facing prompts.
 */
export const PROMPT_TEMPLATES = {
  // Transformation mode prompts
  transformation: {
    userEvaluation: (statement, userVal) =>
        `Aufgabe: Formuliere die Aussage "${statement}" um.\n\nEingabe des Nutzers: "${userVal}"\n\nGib eine kurze, hilfreiche Rückmeldung (max. 2-3 Sätze) zu dieser spezifischen Umformulierung.`,
  },
};

/**
 * Builds a complete system prompt for a given mode and configuration.
 * Places absolute rules at the end for maximum priority.
 * 
 * @param {string} mode - The application mode (e.g., 'transformation').
 * @param {Object} [customPrompts] - Optional custom prompts from scenario configuration.
 * @param {Object} [customPrompts.trainer] - Custom trainer/coach prompt.
 * @returns {string} The complete system prompt.
 */
export function buildSystemPrompt(mode, customPrompts = {}) {
  const modeConfig = MODE_PROMPTS[mode];
  if (!modeConfig) {
    console.warn(`No mode configuration found for mode: ${mode}. Using fallback.`);
    return FALLBACK_PROMPTS.transformation;
  }

  // Start with base prompt for the mode
  const promptParts = [modeConfig.base];

  // Add mode-specific rules
  if (modeConfig.rules) {
    promptParts.push(...modeConfig.rules);
  }

  // Add custom prompts if provided
  if (customPrompts.trainer) {
    promptParts.unshift(customPrompts.trainer);
  }

  // Join with double newlines and ensure absolute rules are at the end
  return promptParts.join("\n\n");
}

/**
 * Sets up the system prompt for the chat.
 * This is the single source of truth for system prompt initialization.
 * 
 * @param {string} mode - The application mode.
 * @param {Object} [config] - Optional scenario configuration containing custom prompts.
 * @param {Object} [config.prompts] - Custom prompts from the scenario.
 * @returns {void}
 */
export function setupSystemPrompt(mode, config = {}) {
  // Validate inputs
  if (!mode) {
    console.error("setupSystemPrompt: mode parameter is required");
    return;
  }

  if (!config) {
    config = {};
  }

  // Build the complete system prompt
  const systemPrompt = buildSystemPrompt(mode, config.prompts || {});

  // Set the system prompt in the Chat module
  Chat.setSystemPrompt(systemPrompt);
}

/**
 * Gets the fallback prompt for a given mode.
 * 
 * @param {string} mode - The application mode.
 * @returns {string} The fallback prompt for the mode.
 */
export function getFallbackPrompt(mode) {
  return FALLBACK_PROMPTS[mode] || FALLBACK_PROMPTS.transformation;
}

// Export for compatibility with existing code
export { ABSOLUTE_RULES, MODE_PROMPTS, FALLBACK_PROMPTS };
