import { Utils } from "./utils.js";

/**
 * API-Kommunikation und Ressourcen-Laden
 */

export const API = {
  /**
   * Loads the content of a specific prompt file (system, partner, mentor).
   * @param {string} type - The subfolder name (e.g., 'system', 'partner').
   * @param {string} promptName - The filename without extension.
   * @returns {Promise<string>} The trimmed content of the prompt file.
   */
  async loadPromptContent(type, promptName) {
    if (!promptName) return "";
    const path = `prompts/${type}/${promptName}.txt?t=${Date.now()}`;
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Prompt-Datei konnte nicht geladen werden: ${path}`);
    }
    const content = (await response.text()).trim();
    return content;
  },

  /**
   * Lädt ein komplettes Szenario inkl. aller verknüpften Prompts
   */
  async fetchCompleteScenario(filePath) {
    if (!filePath) throw new Error("Kein Dateipfad angegeben.");
    const response = await fetch(`${filePath}?t=${Date.now()}`);

    if (!response.ok)
      throw new Error(`Datei konnte nicht geladen werden: ${filePath}`);
    const text = await response.text();

    const { metaSection, instructionSection } =
      Utils.parseScenarioContent(text);

    const config = {
      title: Utils.parseMetaValue(metaSection, "title"),
      roleLabel: Utils.parseMetaValue(metaSection, "role_label"),
      systemFile: Utils.parseMetaValue(metaSection, "system_prompt"),
      partnerFile: Utils.parseMetaValue(metaSection, "partner_prompt"),
      mentorFile: Utils.parseMetaValue(metaSection, "mentor_prompt"),
      instructionSection,
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

    await Promise.all(promptPromises);
    return { ...config, prompts };
  },

  async fetchScenarioTitle(filePath) {
    if (!filePath) return null;
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
