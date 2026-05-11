import { Utils } from "./utils.js";

/**
 * API communication and resource loading
 */

// Simple cache for frequently accessed resources
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let activeChatController = null;

export const API = {
  /**
   * Loads the content of a specific prompt file (system, partner, mentor, or trainer).
   * @param {string} type - The subfolder name (e.g., 'system', 'partner', 'trainers').
   * @param {string} promptName - The filename without extension.
   * @returns {Promise<string>} The trimmed content of the prompt file.
   */
  _getCacheBuster() {
    return `t=${Date.now()}`;
  },

  /**
   * Centralized request handler for fetch requests
   */
  async _request(url, options = {}) {
    const separator = url.includes("?") ? "&" : "?";
    const finalUrl = `${url}${separator}${this._getCacheBuster()}`;

    try {
      const response = await fetch(finalUrl, options);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error.name === "AbortError") return null;

      let userMessage = error.message;
      if (error instanceof TypeError || error.message.includes("fetch")) {
        userMessage =
          "Network error or CORS block. Check backend configuration.";
      }
      console.error(`Request failed [${url}]:`, error);
      throw new Error(userMessage);
    }
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

    const response = await this._request(`prompts/${type}/${promptName}.txt`);
    const content = (await response.text()).trim();

    // Cache the result
    CACHE.set(cacheKey, {
      content,
      timestamp: Date.now(),
    });

    return content;
  },

  /**
   * Loads a complete scenario including all associated prompts in parallel.
   * @param {string} filePath - The path to the scenario .txt file.
   * @returns {Promise<Object>} The parsed scenario configuration and loaded prompts.
   */
  async fetchCompleteScenario(filePath) {
    const response = await this._request(filePath);
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

    // Map file keys to their respective prompt directories
    const promptMap = {
      trainer: { file: config.trainerPromptFile, dir: "trainers" },
    };

    // Execute multiple fetch requests in parallel for optimized performance
    const prompts = {};
    // Load all defined prompts in parallel
    await Promise.all(
      Object.entries(promptMap).map(async ([key, cfg]) => {
        if (cfg.file) {
          prompts[key] = await this.loadPromptContent(cfg.dir, cfg.file);
        }
      }),
    );

    return { ...config, prompts };
  },

  /**
   * Fetches only the title from a scenario source file for dropdown population.
   * @param {string} filePath - The path to the scenario .txt file.
   * @returns {Promise<string|null>} The title string or null if not found.
   */
  async fetchScenarioTitle(filePath) {
    const response = await this._request(filePath).catch(() => null);
    if (!response) return null;
    const content = await response.text();
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

    // Abort any ongoing request before starting a new one
    if (activeChatController) activeChatController.abort();
    activeChatController = new AbortController();

    // Use the unified request handler for the Chat API call
    const response = await this._request(proxyUrl, {
      method: "POST",
      signal: activeChatController.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature,
      }),
    });

    if (!response) return null;
    return response.json();
  },
};
