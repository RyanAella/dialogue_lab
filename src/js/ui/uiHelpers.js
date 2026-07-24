/**
 * @module UIHelpers
 * UI-related helper functions used across the application.
 */

import { Chat } from "../features/chat.js";
import { UI } from "./ui.js";

/**
 * Appends a message from the partner/assistant to both Chat history and UI.
 * Combines Chat.add() and UI.appendMessage() for partner messages.
 * 
 * @param {string} content - The message content to display
 * @param {Object} config - The scenario configuration object
 * @param {Object} [options={}] - Additional options for UI.appendMessage
 */
export function appendPartnerMessage(content, config, options = {}) {
  Chat.add("assistant", content);
  UI.appendMessage(content, "partner", {
    roleName: config.roleName,
    messageType: "task",
    isIchMode: true,
    shouldScroll: false,
    ...options,
  });
}

/**
 * Updates both input UI state and status message in one call.
 * 
 * @param {boolean} inputDisabled - Whether the input should be disabled
 * @param {string} inputPlaceholder - The placeholder text for the input
 * @param {string} statusType - The status type (e.g., 'idle', 'loading', 'error')
 * @param {string} statusMessage - The status message to display
 */
export function updateInputAndStatus(inputDisabled, inputPlaceholder, statusType, statusMessage) {
  UI.updateInputUI(inputDisabled, inputPlaceholder);
  UI.updateStatus(statusType, statusMessage);
}

/**
 * Displays an error message in the briefing content area.
 * @param {string} message - The error message to display
 */
export function showBriefingError(message) {
  UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">${message}</p>`;
}
