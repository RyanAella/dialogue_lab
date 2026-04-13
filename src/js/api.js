import { Utils } from "./utils.js";

/**
 * API communication and resource loading module
 */

export const API = {
  /**
   * Loads the content of a specific prompt file (system, partner, mentor, or trainer).
   * @param {string} type - The subfolder name (e.g., 'system', 'partner', 'trainers').
   * @param {string} promptName - The filename without extension.
   * @returns {Promise<string>} The trimmed content of the prompt file.
   */
  async loadPromptContent(type, promptName) {
    if (!promptName) return "";
    const response = await fetch(
      `prompts/${type}/${promptName}.txt?t=${Date.now()}`,
    );
    if (!response.ok) {
      throw new Error(
        `Prompt file could not be loaded: prompts/${type}/${promptName}.txt`,
      );
    }
    const content = (await response.text()).trim();
    return content;
  },

  /**
   * Loads a complete exercise configuration and its associated prompt files in parallel.
   * @param {string} filePath - The path to the exercise .txt file.
   * @returns {Promise<Object>} The parsed exercise configuration and loaded prompts.
   */
  async fetchCompleteExercise(filePath) {
    const response = await fetch(`${filePath}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Datei konnte nicht geladen werden.");
    const text = await response.text();

    // Parse the raw text into metadata and briefing sections
    const { metaSection, instructionSection } =
      Utils.parseScenarioContent(text);

    // Extract specific metadata values into a typed configuration object
    const config = {
      title: Utils.parseMetaValue(metaSection, "title"),
      roleLabel: Utils.parseMetaValue(metaSection, "role_label"),
      trainerPromptFile: Utils.parseMetaValue(metaSection, "trainer_prompt"),
      instructionSection,
      shortInstruction: Utils.parseMetaValue(metaSection, "short_instruction"),
    };

    // Execute multiple fetch requests in parallel for optimized performance
    const promptPromises = [];
    const prompts = {};

    if (config.trainerPromptFile)
      promptPromises.push(
        this.loadPromptContent("trainers", config.trainerPromptFile).then(
          (c) => (prompts.trainer = c),
        ),
      );

    await Promise.all(promptPromises);
    return { ...config, prompts };
  },

  /**
   * Fetches only the title from an exercise source file for dropdown population.
   * @param {string} filePath - The path to the exercise .txt file.
   * @returns {Promise<string|null>} The title string or null if not found.
   */
  async fetchExerciseTitle(filePath) {
    const response = await fetch(`${filePath}?t=${Date.now()}`);
    if (!response.ok) return null;
    const content = await response.text();
    // Extract title using regex to avoid parsing the full instruction section
    const titleMatch = content.match(/title:\s*(.*)/);
    return titleMatch ? titleMatch[1].trim() : null;
  },

  /**
   * Sends a collection of messages to the chat API via a proxy.
   * @param {Array} messages - The message history to send.
   * @param {Object} config - Proxy and model configuration parameters.
   * @returns {Promise<Object>} The API response data.
   */
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
