/**
 * @module WindowHandlers
 * Global window handler functions for modal management and UI updates.
 * These functions are bound to the window object for HTML onclick compatibility.
 */

/**
 * Closes the feedback modal and restores body scroll.
 * @returns {void}
 */
export function closeFeedbackModal() {
  const feedbackModal = document.getElementById("feedback-modal");
  if (feedbackModal) {
    feedbackModal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

/**
 * Closes the reset modal with a scale-out animation.
 * @returns {void}
 */
export function closeResetModal() {
  const modal = document.getElementById("reset-modal");
  if (!modal) return;
  const content = modal.querySelector("div");
  if (content) {
    content.classList.replace("scale-100", "scale-95");
    setTimeout(() => modal.classList.add("hidden"), 200);
  }
}

/**
 * Updates the subtitle text based on screen width.
 * Provides a hint for mobile users on how to access the menu.
 * @returns {void}
 */
export function updateSubtitleText() {
  const sub = document.getElementById("main-subtitle");
  if (!sub) return;
  const base = "Wähle ein Szenario aus, um zu starten.";
  sub.innerHTML = window.innerWidth < 1024
    ? `${base} <br><span class="text-xs text-blue-600">Übung wechseln? Klicke oben rechts auf ☰</span>`
    : base;
}

// Auto-bind to window for HTML onclick compatibility
window.closeFeedbackModal = closeFeedbackModal;
window.closeResetModal = closeResetModal;
window.updateSubtitleText = updateSubtitleText;
