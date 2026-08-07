/**
 * @module PromptBuilder
 * Zentrale Prompt-Verwaltung für die Anwendung.
 * Stellt sicher, dass alle System-Prompts konsistent mit den absoluten Regeln gesetzt werden.
 */

import { Chat } from "../features/chat.js";
import { PROMPT_TEMPLATES } from "./config.js";
import { ABSOLUTE_RULES } from "../../data/promptRules.js";

/**
 * Zentrale Instanz für Prompt-Erstellung und -Verwaltung.
 */
export const PromptBuilder = {
    /**
     * Erstellt den vollständigen System-Prompt mit allen Regeln.
     * @param {Object} config - Szenario-Konfiguration (enthält prompts.system, prompts.partner)
     * @returns {string} Der vollständige System-Prompt
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
     * Setzt den System-Prompt und optional löscht den Chat-Verlauf.
     * @param {Object} config - Szenario-Konfiguration
     * @param {boolean} [clearHistory=true] - Chat-Verlauf zurücksetzen
     */
    setupSystemPrompt(config, clearHistory = true) {
        // Sicherheit: Abbruch, wenn keine gültige Config
        if (!config || !config.prompts) {
            console.warn("PromptBuilder: Keine gültige Config – System-Prompt wird nicht gesetzt");
            return;
        }

        if (clearHistory) {
            Chat.clear();
        }
        Chat.setSystemPrompt(this.buildSystemPrompt(config));
    }
};
