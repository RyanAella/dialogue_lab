import { Utils } from "./utils.js";

/**
 * @module API
 * Handles API communication, resource fetching, and localized caching
 * for the application's prompts and scenario configurations.
 */

/**
 * Simple in-memory cache for frequently accessed text resources.
 * @type {Map<string, {content: string, timestamp: number}>}
 */
const CACHE = new Map();

/**
 * Cache duration in milliseconds (5 minutes).
 * @type {number}
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Controller used to abort pending chat API requests when a new one starts.
 * @type {AbortController|null}
 */
let activeChatController = null;

export const API = {
  /**
   * Generates a unique timestamp string to prevent browser caching of requests.
   * @returns {string} A query parameter string like "t=123456789".
   * @private
   */
  _getCacheBuster() {
    return `t=${Date.now()}`;
  },

  /**
   * Core fetch wrapper that implements cache busting and standardized error handling.
   *
   * @param {string} url - The target URL for the request.
   * @param {RequestInit} [options={}] - Standard fetch options (method, headers, body, etc.).
   * @returns {Promise<Response|null>} The fetch response or null if the request was aborted.
   * @throws {Error} Throws an error for HTTP failures or network connectivity issues.
   * @private
   */
  async _request(url, options = {}) {
    // Log the request for debugging purposes
    if (options.body) {
        console.log(`API Request to ${url}:`, JSON.parse(options.body));
    }

    const separator = url.includes("?") ? "&" : "?";
    const finalUrl = `${url}${separator}${this._getCacheBuster()}`;

    try {
      const response = await fetch(finalUrl, options);
      if (!response.ok) {
        // Try to get detailed error info from the response body
        const errorText = await response.text();
        let errorMessage = `HTTP Error: ${response.status}`;
        try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.error || errData.message || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
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
   * Clears the internal in-memory cache.
   * Useful for development or forcing a refresh of scenario data.
   */
  clearCache() {
    CACHE.clear();
  },

  /**
   * Fetches raw text content from a URL.
   * @param {string} url - The target URL.
   * @returns {Promise<string>}
   */
  async fetchText(url) {
    const response = await this._request(url);
    return response ? response.text() : "";
  },

  /**
   * Loads the text content of a specific prompt file with caching support.
   *
   * @param {string} type - The subfolder within prompts (e.g., 'system', 'partner', 'mentor').
   * @param {string} promptName - The filename without extension.
   * @returns {Promise<string>} The trimmed text content of the prompt.
   * @async
   */
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
   * Orchestrates the loading of a scenario file and all its associated prompt files.
   * Prompts are loaded in parallel for better performance.
   *
   * @param {string} filePath - Path to the .txt scenario file.
   * @param {string} type - The exercise type (e.g., 'SIMULATION' or 'TRANSFORMATION').
   * @returns {Promise<Object>} Object containing scenario config and a 'prompts' map.
   * @async
   */
  async fetchCompleteScenario(filePath, type) {
    const response = await this._request(filePath);
    const text = await response.text();

    const { metaSection, instructionSection } =
      Utils.parseScenarioContent(text);

    const config = {
      title: Utils.parseMetaValue(metaSection, "title"),
      roleLabel: Utils.parseMetaValue(metaSection, "role_label"),
      trainerPromptFile: Utils.parseMetaValue(metaSection, "trainer_prompt"),
      systemPromptFile: Utils.parseMetaValue(metaSection, "system_prompt"),
      partnerPromptFile: Utils.parseMetaValue(metaSection, "partner_prompt"),
      mentorPromptFile: Utils.parseMetaValue(metaSection, "mentor_prompt"),
      instructionSection,
      shortInstruction: Utils.parseMetaValue(metaSection, "short_instruction"),
    };

    // The API only loads what is explicitly defined in the metadata.
    // No more "magic" fallbacks at this level.
    const promptMap = {
      trainer: { file: config.trainerPromptFile, dir: "trainer" },
      system: { file: config.systemPromptFile, dir: "system" },
      partner: { file: config.partnerPromptFile, dir: "partner" },
      mentor: { file: config.mentorPromptFile, dir: "mentor" }
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

  /**
   * Fetches only the title from a scenario file's meta section.
   *
   * @param {string} filePath - Path to the .txt scenario file.
   * @returns {Promise<string|null>} The title string or null if not found.
   * @async
   */
  async fetchScenarioTitle(filePath) {
    const response = await this._request(filePath).catch(() => null);
    if (!response) return null;
    const content = await response.text();
    const titleMatch = content.match(/title:\s*(.*)/);
    return titleMatch ? titleMatch[1].trim() : null;
  },

  /**
   * Sends a message history to the AI proxy and retrieves the completion.
   * Automatically aborts previous pending chat requests.
   *
   * @param {Array<Object>} messages - The chat history in OpenAI message format.
   * @param {Object} config - Configuration including proxyUrl, model, and temperature.
   * @returns {Promise<Object|null>} The JSON response from the API.
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
