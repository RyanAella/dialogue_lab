/**
 * @module WindowHandlers
 * Global window handler functions for UI updates.
 * These functions are bound to the window object for HTML onclick compatibility.
 */

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
window.updateSubtitleText = updateSubtitleText;