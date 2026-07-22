/**
 * @module Feedback
 * Handles feedback requests and modal management.
 */

import { APP_CONFIG } from './config.js';
import { API } from './api.js';
import { Chat } from './chat.js';
import { DataLogger } from './dataLogger.js';
import { UI } from './ui.js';
import { ScenarioService } from './scenario.js';

/**
 * Requests feedback from the AI and displays it in a modal.
 * @async
 */
export async function handleFeedback() {
  if (Chat.getMessageCount() === 0) return;
  const config = ScenarioService.getActive();
  if (!config || !config.prompts) return;

  const STATE = window.STATE;
  const isTransform = config.type === "TRANSFORMATION";
  const evalPrompt = isTransform ? config.prompts.trainer : config.prompts.mentor;
  const finalPrompt = evalPrompt || (isTransform
    ? APP_CONFIG.FALLBACK_PROMPTS.transformation
    : APP_CONFIG.FALLBACK_PROMPTS.simulation);

  if (UI.elements.loadingTitle) {
    UI.elements.loadingTitle.textContent = isTransform 
      ? "Coach analysiert das Gespräch..."
      : "Mentor analysiert das Gespräch...";
  }
  UI.elements.loadingOverlay?.classList.remove("hidden");
  UI.updateStatus("loading", isTransform ? "Coach analysiert..." : "Mentor analysiert...");
  
  let inputForAnalysis;
  if (isTransform) {
    inputForAnalysis = "Hier sind die Ergebnisse der Übung:\n\n" + 
      STATE.answers.map((a, i) => `Aussage ${i+1}: "${a.statement}"\nAntwort: "${a.userResponse}"`).join("\n\n");
  } else {
    inputForAnalysis = `Gesprächsprotokoll:\n${Chat.getTranscript(config.roleName)}`;
  }

  try {
    const data = await API.callChatApi(
      [
        { role: "system", content: finalPrompt },
        { role: "user", content: inputForAnalysis },
      ],
      {
        proxyUrl: APP_CONFIG.PROXY_URL,
        model: APP_CONFIG.MODEL,
        temperature: APP_CONFIG.COACH_TEMPERATURE,
      },
    );

    if (data) {
      const feedback = data.choices[0].message.content;
      STATE.lastFeedback = feedback;
      DataLogger.endConversation();

      if (UI.elements.feedbackModalTitle) {
        UI.elements.feedbackModalTitle.innerHTML = isTransform
          ? "<span>📊</span> Coach-Analyse"
          : "<span>📊</span> Mentor-Feedback";
      }
      UI.showFeedbackModal(feedback);

      if (STATE.ttsEnabled) {
        UI.speak(feedback, isTransform ? "Coach" : "Mentor");
      }

      UI.elements.feedbackBtn?.classList.add("hidden");
      if (UI.elements.exportTranscriptBtn) {
        UI.elements.exportTranscriptBtn.classList.remove("hidden");
      }
      UI.updateStatus("idle", "Fertig");
    } else {
      UI.updateStatus("error", "Fehler: Keine Antwort von der KI erhalten.");
    }
  } catch (e) {
    console.error("Feedback request failed:", e);
    const errorText = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
    UI.updateStatus("error", "Fehler: " + errorText);
  } finally {
    UI.elements.loadingOverlay.classList.add("hidden");
  }
}

/**
 * Closes the feedback modal.
 * @async
 */
export async function closeFeedbackModal() {
  const modal = UI.elements.feedbackModal;
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  await confirmReset();
}

/**
 * Confirms reset and returns to appropriate mode.
 * @async
 */
export async function confirmReset() {
  const STATE = window.STATE;
  const modal = UI.elements.resetModal || document.getElementById("reset-modal");
  if (modal) modal.classList.add("hidden");
  
  if (STATE.currentMode === "transformation") {
    if (typeof window.restartTransformationExercise === 'function') {
      window.restartTransformationExercise();
    }
  } else {
    if (typeof window.switchToRoleplayMode === 'function') {
      await window.switchToRoleplayMode();
    }
  }
}

// Make globally available for onclick attributes
window.handleFeedback = handleFeedback;
window.closeFeedbackModal = closeFeedbackModal;
window.confirmReset = confirmReset;
