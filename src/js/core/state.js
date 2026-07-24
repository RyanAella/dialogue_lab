/**
 * @module State
 * Centralized application state management for Dialogue Lab.
 */

import { APP_MODES } from "./config.js";
import { Chat } from "../features/chat.js";
import { UI } from "../ui/ui.js";

/**
 * Global application state.
 * Holds runtime data that changes during a session.
 * @type {Object}
 * @property {Object[]} answers - Collected user answers for batch evaluation in transformation mode.
 * @property {string} currentMode - The active operation mode (APP_MODES.ROLEPLAY or APP_MODES.TRANSFORMATION).
 * @property {number} exerciseIndex - The current progression index within an exercise.
 * @property {string[]} activeStatements - The pool of statements for the current transformation exercise.
 * @property {boolean} ttsEnabled - Flag for global text-to-speech autoplay.
 * @property {null} lastFeedback - Stores the last feedback received.
 */
export let STATE = {
  answers: [],
  currentMode: APP_MODES.ROLEPLAY,
  exerciseIndex: 0,
  activeStatements: [],
  ttsEnabled: false,
  lastFeedback: null,
};

// Make STATE globally available for legacy compatibility
window.STATE = STATE;

/**
 * Resets the common state properties.
 */
export function resetState() {
  STATE.exerciseIndex = 0;
  STATE.answers = [];
  STATE.lastFeedback = null;
  Chat.clear();
}

/**
 * Resets the UI elements for chat and sidebar.
 */
export function resetUI() {
  UI.elements.chatWindow.innerHTML = "";
  UI.setExerciseActionsVisible(false);
  if (UI.elements.exportTranscriptBtn) {
    UI.elements.exportTranscriptBtn.classList.add("hidden");
  }
  // Reset sidebar buttons visibility (they may have been hidden after feedback)
  resetSidebarButtons();
}

/**
 * Resets the sidebar action buttons to their initial disabled state.
 */
export function resetSidebarButtons() {
  const btn = UI.elements.feedbackBtn;
  if (btn) {
    btn.classList.remove("hidden");
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
  }
  if (UI.elements.resetBtn) {
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

/**
 * Enables the sidebar action buttons (feedback and reset).
 */
export function enableSidebarButtons() {
  [UI.elements.feedbackBtn, UI.elements.resetBtn].forEach((btn) => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });
}
