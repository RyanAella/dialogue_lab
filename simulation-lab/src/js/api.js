import { Utils } from "./utils.js";

/**
 * API communication and resource loading
 */

// Simple cache for frequently accessed resources
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let activeChatController = null;

export const API = {
  _getCacheBuster() {
    return `t=${Date.now()}`;
  },

  /**
   * Helper for fetch with cache busting and error handling
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
   * Loads a complete scenario including all linked prompts
   */
  async fetchCompleteScenario(filePath) {
    const response = await this._request(filePath);
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

    // Map file keys to their respective prompt directories
    const promptMap = {
      system: { file: config.systemFile, dir: "system" },
      partner: { file: config.partnerFile, dir: "partner" },
      mentor: { file: config.mentorFile, dir: "mentor" },
    };

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

  async fetchScenarioTitle(filePath) {
    const response = await this._request(filePath).catch(() => null);
    if (!response) return null;
    const content = await response.text();
    const titleMatch = content.match(/title:\s*(.*)/);
    return titleMatch ? titleMatch[1].trim() : null;
  },

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
