/**
 * @module Feedback
 * Handles feedback requests and modal management.
 */

import { APP_CONFIG, APP_MODES, EXERCISE_TYPES, FEEDBACK_MESSAGES } from '../core/config.js';
import { API } from '../services/api.js';
import { Chat } from './chat.js';
import { DataLogger } from '../services/dataLogger.js';
import { UI } from '../ui/ui.js';
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
    const isTransform = config.type === EXERCISE_TYPES.TRANSFORMATION;
    const evalPrompt = isTransform ? config.prompts.trainer : config.prompts.mentor;
    const finalPrompt = evalPrompt || (isTransform
        ? APP_CONFIG.FALLBACK_PROMPTS.transformation
        : APP_CONFIG.FALLBACK_PROMPTS.simulation);

    if (UI.elements.loadingTitle) {
        UI.elements.loadingTitle.textContent = isTransform
            ? FEEDBACK_MESSAGES.loading.title.transformation
            : FEEDBACK_MESSAGES.loading.title.simulation;
    }
    UI.elements.loadingOverlay?.classList.remove("hidden");
    UI.updateStatus("loading", isTransform
        ? FEEDBACK_MESSAGES.loading.status.transformation
        : FEEDBACK_MESSAGES.loading.status.simulation);

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

            if (UI.elements.feedbackModalTitle) {
                UI.elements.feedbackModalTitle.innerHTML = isTransform
                    ? FEEDBACK_MESSAGES.modal.title.transformation
                    : FEEDBACK_MESSAGES.modal.title.simulation;
            }
            UI.showFeedbackModal(feedback);

            if (STATE.ttsEnabled) {
                UI.speak(feedback, isTransform
                    ? FEEDBACK_MESSAGES.tts.transformation
                    : FEEDBACK_MESSAGES.tts.simulation);
            }

            UI.elements.feedbackBtn?.classList.add("hidden");
            if (UI.elements.exportTranscriptBtn) {
                UI.elements.exportTranscriptBtn.classList.remove("hidden");
            }
            UI.updateStatus("idle", FEEDBACK_MESSAGES.status.ready);
        } else {
            UI.updateStatus("error", FEEDBACK_MESSAGES.status.error);
        }
    } catch (e) {
        console.error("Feedback request failed:", e);
        const errorText = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
        UI.updateStatus("error", FEEDBACK_MESSAGES.errorPrefix + errorText);
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

    // Close reset modal
    const resetModal = UI.elements.resetModal || document.getElementById("reset-modal");
    if (resetModal) resetModal.classList.add("hidden");

    // End current conversation and WAIT for upload to complete
    await DataLogger.endConversation();

    // Now start new conversation based on mode
    if (STATE.currentMode === APP_MODES.TRANSFORMATION) {
        if (typeof window.restartTransformationExercise === 'function') {
            window.restartTransformationExercise();
        }
    } else {
        // For roleplay mode, reload the current scenario
        const active = ScenarioService.getActive();
        if (active && active.id && typeof window.loadContent === 'function') {
            await window.loadContent(active.id);
        } else if (typeof window.switchToRoleplayMode === 'function') {
            await window.switchToRoleplayMode();
        }
    }
}

// Make globally available for onclick attributes
window.handleFeedback = handleFeedback;
window.closeFeedbackModal = closeFeedbackModal;
window.confirmReset = confirmReset;
window.closeResetModal = confirmReset;