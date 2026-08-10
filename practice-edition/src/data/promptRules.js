/**
 * @module PromptRules
 * Centralized configuration for absolute AI behavior rules.
 * Contains the core instructions that govern AI behavior across all modes.
 */

/**
 * Absolute AI behavior rules that must be followed in all interactions.
 * These rules are placed at the end of system prompts for maximum priority (OpenAI behavior).
 */
export const ABSOLUTE_RULES = {
  // Core instruction: AI must never initiate conversations
  waitForUser: "Reagiere NUR auf das, was der Nutzer sagt. Beginne NIE von selbst Gespräche, führe NIE Themen ein und übernimm NIE die Initiative.",

  // Enhanced rule for handling greetings
  handleGreetings: "KRITISCHE REGEL: Antworte NUR auf das, was der Nutzer explizit anspricht. Bei Begrüßungen antworte kurz und neutral. Beginne NIE von selbst Gespräche über Reporting, Blockaden oder andere Themen.",

  // Role adherence
  stayInCharacter: "Bleibe konsequent in deiner Rolle und gib dem Nutzer die Gesprächsinitiative. Führe keine eigenen Themen ein.",
};

/**
 * Mode-specific system prompt configurations.
 */
export const MODE_PROMPTS = {
  transformation: {
    base: "Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen des Nutzers kritisch und gib konstruktives Feedback.",
    rules: [
      ABSOLUTE_RULES.waitForUser,
      "Gib kurz und präzises Feedback (max. 2-3 Sätze) zu jeder spezifischen Umformulierung.",
      "Sei hilfreich und konstruktiv, aber bleibe neutral und sachlich.",
    ],
  },
};

/**
 * Fallback prompts for when scenario-specific prompts are missing.
 */
export const FALLBACK_PROMPTS = {
  transformation: `Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen des Nutzers kritisch und gib konstruktives Feedback.

${ABSOLUTE_RULES.waitForUser}
${ABSOLUTE_RULES.stayInCharacter}`,
};
