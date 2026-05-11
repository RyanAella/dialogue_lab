import { Utils } from "./utils.js";

/**
 * API-Kommunikation und Ressourcen-Laden
 */

// Simple cache for frequently accessed resources
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const API = {
  _getCacheBuster() {
    return `t=${Date.now()}`;
  },

  /**
   * Clears the cache - useful for development or when content updates
   */
  clearCache() {
    CACHE.clear();
  },

  async loadPromptContent(type, promptName) {
    if (!promptName) return "";

    const cacheKey = `prompt_${type}_${promptName}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.content;
    }

    const response = await fetch(
      `prompts/${type}/${promptName}.txt?t=${Date.now()}`,
    );
    if (!response.ok) {
      throw new Error(
        `Prompt-Datei konnte nicht geladen werden: prompts/${type}/${promptName}.txt`,
      );
    }
    const content = (await response.text()).trim();

    // Cache the result
    CACHE.set(cacheKey, {
      content,
      timestamp: Date.now(),
    });

    return content;
  },

  /**
   * Lädt ein komplettes Szenario inkl. aller verknüpften Prompts
   */
  async fetchCompleteScenario(filePath) {
    const response = await fetch(`${filePath}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Datei konnte nicht geladen werden.");
    const text = await response.text();

    const { metaSection, instructionSection } =
      Utils.parseScenarioContent(text);

    const config = {
      title: Utils.parseMetaValue(metaSection, "title"),
      roleLabel: Utils.parseMetaValue(metaSection, "role_label"),
      trainerPromptFile: Utils.parseMetaValue(metaSection, "trainer_prompt"),
      systemFile: Utils.parseMetaValue(metaSection, "system_prompt"),
      partnerFile: Utils.parseMetaValue(metaSection, "partner_prompt"),
      mentorFile: Utils.parseMetaValue(metaSection, "mentor_prompt"),
      instructionSection,
      shortInstruction: Utils.parseMetaValue(metaSection, "short_instruction"),
    };

    // Alle benötigten Prompts parallel laden
    const promptPromises = [];
    const prompts = {};

    if (config.systemFile)
      promptPromises.push(
        this.loadPromptContent("system", config.systemFile).then(
          (c) => (prompts.system = c),
        ),
      );
    if (config.partnerFile)
      promptPromises.push(
        this.loadPromptContent("partner", config.partnerFile).then(
          (c) => (prompts.partner = c),
        ),
      );
    if (config.mentorFile)
      promptPromises.push(
        this.loadPromptContent("mentor", config.mentorFile).then(
          (c) => (prompts.mentor = c),
        ),
      );
    if (config.trainerPromptFile)
      promptPromises.push(
        this.loadPromptContent("trainers", config.trainerPromptFile).then(
          (c) => (prompts.trainer = c),
        ),
      );

    await Promise.all(promptPromises);
    return { ...config, prompts };
  },

  async fetchScenarioTitle(filePath) {
    const response = await fetch(`${filePath}?t=${Date.now()}`);
    if (!response.ok) return null;
    const content = await response.text();
    const titleMatch = content.match(/title:\s*(.*)/);
    return titleMatch ? titleMatch[1].trim() : null;
  },

  async callChatApi(messages, config) {
    const { proxyUrl, model, temperature } = config;

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "API Anfrage fehlgeschlagen");
    }

    return response.json();
  },
};
