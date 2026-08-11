/**
 * @module PromptBuilder
 * Centralized prompt management for the application.
 * Ensures all system prompts are set consistently with absolute rules.
 */

import { Chat } from "../features/chat.js";
import { PROMPT_TEMPLATES } from "./config.js";
import { ABSOLUTE_RULES } from "../../data/promptRules.js";

/**
 * Central instance for prompt creation and management.
 */
export const PromptBuilder = {
    /**
     * Builds the complete system prompt with all rules.
     * @param {Object} config - Scenario configuration (contains prompts.system, prompts.partner)
     * @returns {string} The complete system prompt
     */
    buildSystemPrompt(config) {
        return `${ABSOLUTE_RULES}\n\n
    ${PROMPT_TEMPLATES.roleplay.roleAdherence}\n\n
    ${ABSOLUTE_RULES}\n\n
    ${config.prompts.system}\n\n
    ${ABSOLUTE_RULES}\n\n
    ${config.prompts.partner}\n\n
    ${ABSOLUTE_RULES}`;
    },

    /**
     * Sets the system prompt and optionally clears chat history.
     * @param {Object} config - Scenario configuration
     * @param {boolean} [clearHistory=true] - Reset chat history
     */
    setupSystemPrompt(config, clearHistory = true) {
        // Safety: Abort if config is invalid
        if (!config || !config.prompts) {
            console.warn("PromptBuilder: Invalid config - system prompt not set");
            return;
        }

        if (clearHistory) {
            Chat.clear();
        }
        Chat.setSystemPrompt(this.buildSystemPrompt(config));
    }
};
