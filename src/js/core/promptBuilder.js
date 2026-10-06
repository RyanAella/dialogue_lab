/**
 * @module PromptBuilder
 * Centralized prompt management for the Dialogue Lab application.
 * Provides a single source of truth for all system prompt logic.
 * Supports both mode-based (practice-edition) and config-based (simulation-lab) approaches.
 */

import { Chat } from "../features/chat.js";
import { ABSOLUTE_RULES, MODE_PROMPTS, FALLBACK_PROMPTS } from "../../data/promptRules.js";
import { PROMPT_TEMPLATES as CONFIG_PROMPT_TEMPLATES } from "./config.js";

/**
 * Prompt templates for generating user-facing prompts.
 * Combines templates from both practice-edition and simulation-lab.
 */
export const PROMPT_TEMPLATES = {
    // Roleplay mode prompts (from simulation-lab)
    roleplay: {
        roleAdherence: "Verhalte dich konsequent gemäß deiner Rollenbeschreibung. Überlasse die Gesprächsführung und die Initiative dem Benutzer.",
        initialTopicGuidance: "Warte, bis der Benutzer das Thema des Gesprächs einführt, bevor du auf die Details deiner Rolle eingehst.",
        systemPrompt: (systemPrompt, partnerPrompt) =>
            `${systemPrompt}\n\n${partnerPrompt}`,
    },
    // Transformation mode prompts (from practice-edition)
    transformation: {
        userEvaluation: (statement, userVal) =>
            `Aufgabe: Formuliere die Aussage "${statement}" um.\n\nEingabe des Nutzers: "${userVal}"\n\nGib eine kurze, hilfreiche Rückmeldung (max. 2-3 Sätze) zu dieser spezifischen Umformulierung.`,
    },
    // Merge any templates from config
    ...CONFIG_PROMPT_TEMPLATES,
};

/**
 * Builds a complete system prompt for a given mode and configuration.
 * Places absolute rules at the END for maximum priority (OpenAI behavior).
 *
 * @param {string} mode - The application mode (e.g., 'transformation', 'simulation').
 * @param {Object} [customPrompts={}] - Optional custom prompts from scenario configuration.
 * @returns {string} The complete system prompt.
 */
export function buildSystemPrompt(mode, customPrompts = {}) {
    const modeConfig = MODE_PROMPTS[mode];
    const promptParts = [];

    // 1. Add custom prompts from scenario configuration (highest priority)
    if (customPrompts.trainer) {
        promptParts.push(customPrompts.trainer);
    } else if (customPrompts.mentor) {
        promptParts.push(customPrompts.mentor);
    }

    // 2. Add mode-specific base prompt
    if (modeConfig?.base) {
        promptParts.push(modeConfig.base);
    }

    // 3. Add mode-specific non-absolute rules
    if (modeConfig?.rules) {
        const absoluteRuleValues = Object.values(ABSOLUTE_RULES);
        for (const rule of modeConfig.rules) {
            if (!absoluteRuleValues.includes(rule)) {
                promptParts.push(rule);
            }
        }
    }

    // 4. Add roleplay adherence if in roleplay/simulation mode
    if (mode === 'simulation' || mode === 'roleplay') {
        if (PROMPT_TEMPLATES.roleplay?.roleAdherence) {
            promptParts.push(PROMPT_TEMPLATES.roleplay.roleAdherence);
        }
        if (customPrompts.partner) {
            promptParts.push(customPrompts.partner);
        }
    }

    // 5. Add absolute rules at the END for maximum priority
    promptParts.push(...Object.values(ABSOLUTE_RULES));

    // Filter out empty parts and join
    return promptParts.filter(part => part && part.trim()).join("\n\n");
}

/**
 * Alternative build method for config-based approach (simulation-lab style).
 * Combines system and partner prompts with absolute rules.
 *
 * @param {Object} config - Scenario configuration with prompts.system and prompts.partner
 * @returns {string} The complete system prompt
 */
export function buildSystemPromptFromConfig(config) {
    if (!config?.prompts) {
        console.warn("PromptBuilder: Invalid config provided for buildSystemPromptFromConfig");
        return "";
    }

    const promptParts = [];

    // Add system prompt
    if (config.prompts.system) {
        promptParts.push(config.prompts.system);
    }

    // Add roleplay adherence
    if (PROMPT_TEMPLATES.roleplay?.roleAdherence) {
        promptParts.push(PROMPT_TEMPLATES.roleplay.roleAdherence);
    }

    // Add partner prompt
    if (config.prompts.partner) {
        promptParts.push(config.prompts.partner);
    }

    // Add absolute rules at the end
    promptParts.push(...Object.values(ABSOLUTE_RULES));

    return promptParts.filter(part => part && part.trim()).join("\n\n");
}

/**
 * Sets up the system prompt for the chat.
 * Unified method that supports both mode-based and config-based approaches.
 *
 * @param {string|Object} modeOrConfig - Either a mode string OR a scenario configuration object
 * @param {boolean|Object} [secondParam=false] - For mode-based: boolean indicating roleplay mode.
 *                                                For config-based: the config object (when first param is mode string).
 * @returns {void}
 */
export function setupSystemPrompt(modeOrConfig, secondParam = false) {
    // Validate first parameter
    if (!modeOrConfig) {
        console.error("PromptBuilder.setupSystemPrompt: First parameter is required");
        return;
    }

    let systemPrompt;

    // Config-based approach (simulation-lab style)
    if (typeof modeOrConfig === 'object' && modeOrConfig !== null) {
        const config = modeOrConfig;
        const clearHistory = typeof secondParam === 'boolean' ? secondParam : true;

        // Safety check
        if (!config.prompts) {
            console.warn("PromptBuilder: Invalid config - prompts property missing");
            return;
        }

        if (clearHistory) {
            Chat.clear();
        }

        systemPrompt = buildSystemPromptFromConfig(config);
    }
    // Mode-based approach (practice-edition style)
    else {
        const mode = modeOrConfig;
        const customPrompts = typeof secondParam === 'object' ? secondParam : {};

        systemPrompt = buildSystemPrompt(mode, customPrompts);
    }

    // Set the system prompt in the Chat module
    Chat.setSystemPrompt(systemPrompt);
}

/**
 * Gets the fallback prompt for a given mode.
 * Supports multiple mode names and falls back gracefully.
 *
 * @param {string} mode - The application mode.
 * @returns {string} The fallback prompt for the mode.
 */
export function getFallbackPrompt(mode) {
    if (!mode) {
        console.warn("getFallbackPrompt: mode parameter is required");
        return FALLBACK_PROMPTS.transformation ||
            "Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen kritisch und gib konstruktives Feedback.";
    }

    // Normalize and map mode names
    const normalizedMode = mode.toLowerCase();
    const modeMap = {
        'transformation': 'transformation',
        'trainer': 'transformation',
        'coach': 'transformation',
        'simulation': 'simulation',
        'roleplay': 'simulation',
        'mentor': 'simulation',
        'partner': 'simulation',
    };

    const mappedMode = modeMap[normalizedMode] || normalizedMode;

    // Try in order: FALLBACK_PROMPTS -> MODE_PROMPTS -> ultimate fallback
    if (FALLBACK_PROMPTS[mappedMode]) {
        return FALLBACK_PROMPTS[mappedMode];
    }

    if (MODE_PROMPTS[mappedMode]?.base) {
        return MODE_PROMPTS[mappedMode].base;
    }

    // Ultimate fallbacks
    if (['transformation', 'trainer', 'coach'].includes(mappedMode)) {
        return "Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen des Nutzers kritisch und gib konstruktives Feedback.";
    }

    return "Du bist ein Mentor. Analysiere das Gesprächsprotokoll und gib hilfreiches Feedback.";
}

// ============================================
// Export for backward compatibility
// ============================================

// Re-export all rule sets
export { ABSOLUTE_RULES, MODE_PROMPTS, FALLBACK_PROMPTS };

// PromptBuilder class for simulation-lab compatibility
export const PromptBuilder = {
    /**
     * Builds system prompt from config object (simulation-lab style)
     * @param {Object} config - Scenario configuration
     * @returns {string} Complete system prompt
     */
    buildSystemPrompt: buildSystemPromptFromConfig,

    /**
     * Sets up system prompt with optional history clearing
     * @param {Object} config - Scenario configuration
     * @param {boolean} [clearHistory=true] - Whether to clear chat history
     */
    setupSystemPrompt: (config, clearHistory = true) => setupSystemPrompt(config, clearHistory),
};