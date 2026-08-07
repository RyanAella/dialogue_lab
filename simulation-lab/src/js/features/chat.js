import { Utils } from "../utils/utils.js";
import {CHAT_ROLES} from "../core/config.js";

/**
 * @module Chat
 * Manages the chat history state, including system prompts and user/assistant messages.
 * Provides utilities for data transformation, such as generating transcripts.
 */
export let Chat = {
  /**
   * Internal storage for chat messages.
   * @type {Array<{role: string, content: string}>}
   * @private
   */
  _history: [],

  /**
   * Adds a new message to the chat history.
   * @param {string} role - The role of the sender (e.g., 'user', 'assistant', 'system').
   * @param {string} content - The text content of the message.
   */
  add(role, content) {
    this._history.push({ role, content });
  },

  /**
   * Returns a shallow copy of the current chat history.
   * @returns {Array<{role: string, content: string}>}
   */
  getHistory() {
    return [...this._history];
  },

  /**
   * Checks if a message with the 'system' role exists in the history.
   * @returns {boolean} True if a system prompt is found.
   */
  hasSystemPrompt() {
    return this._history.some((m) => m.role === CHAT_ROLES.SYSTEM);
  },

  /**
   * Sets or updates the system prompt.
   * If a system prompt exists, it updates the first entry.
   * Otherwise, it prepends a new system message to the beginning of the history.
   * @param {string} content - The content of the system prompt.
   */
  setSystemPrompt(content) {
    if (this.hasSystemPrompt()) {
      // Update existing system prompt (assumed to be the first element)
      this._history[0].content = content;
    } else {
      this._history.unshift({ role: CHAT_ROLES.SYSTEM, content });
    }
  },

  /**
   * Resets the chat history to an empty array.
   */
  clear() {
    this._history = [];
  },

  /**
   * Calculates the number of messages in the history, excluding system prompts.
   * Useful for determining if a conversation has actually started.
   * @returns {number} The count of non-system messages.
   */
  getMessageCount() {
    return this._history.filter((m) => m.role !== CHAT_ROLES.SYSTEM).length;
  },

  /**
   * Generates a formatted plain-text transcript of the conversation.
   * @param {string} partnerName - The display name of the AI partner for the transcript labels.
   * @returns {string} The formatted transcript.
   */
  getTranscript(partnerName) {
    return Utils.generateTranscript(this._history, partnerName);
  },
};

window.Chat = Chat;
