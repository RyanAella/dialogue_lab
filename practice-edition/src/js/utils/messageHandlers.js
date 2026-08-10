/**
 * @module MessageHandlers
 * Handles message sending logic for transformation mode.
 */

import { API } from "../services/api.js";
import { Chat } from "../features/chat.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_CONFIG, UI_TEXTS } from "../core/config.js";
import { PROMPT_TEMPLATES, getFallbackPrompt } from "../core/promptBuilder.js";
import { UI } from "../ui/ui.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE, enableSidebarButtons } from "../core/state.js";
import { appendPartnerMessage, updateInputAndStatus } from "../ui/uiHelpers.js";

/**
 * Generates a human-readable progress indicator for transformation mode.
 * @returns {string}
 */
export function getTransformationProgressText() {
    return STATE.activeStatements.length
        ? `Aussage ${STATE.exerciseIndex + 1} von ${STATE.activeStatements.length}`
        : UI_TEXTS.status.ready;
}

/**
 * Shared preparation logic for both message modes.
 * @param {string} userVal - The trimmed user input value
 * @returns {Object|null} - config object or null if validation fails
 */
export function prepareMessageSend(userVal) {
    if (!userVal) return null;

    const config = ScenarioService.getActive();
    if (!config) return null;

    UI.prepareForInteraction();
    UI.appendMessage(userVal, "user");
    if (STATE.ttsEnabled) UI.speak(userVal, UI_TEXTS.tts.userLabel);

    DataLogger.addTurn("user", userVal, {
        mode: STATE.currentMode,
        scenarioId: config.id,
        scenarioTitle: config.title
    });

    Chat.add("user", userVal);
    UI.elements.userInput.value = "";

    return config;
}

/**
 * Handles message sending in TRANSFORMATION mode.
 * Provides immediate feedback for each transformation attempt.
 * @param {Object} config - The scenario configuration
 * @returns {Promise<void>}
 */
export async function handleTransformationSend(config) {
    UI.updateInputUI(true, UI_TEXTS.status.analyzing);
    UI.showTypingIndicator(config.roleName);

    // Save response
    STATE.answers.push({
        statement: STATE.activeStatements[STATE.exerciseIndex],
        userResponse: UI.elements.userInput.value.trim(),
    });

    // Get immediate feedback
    try {
        const evalPrompt = config.prompts.trainer || getFallbackPrompt("transformation");
        const userPrompt = PROMPT_TEMPLATES.transformation.userEvaluation(
            STATE.activeStatements[STATE.exerciseIndex],
            STATE.answers[STATE.answers.length - 1].userResponse
        );

        const data = await API.callChatApi(
            [
                { role: "system", content: evalPrompt },
                { role: "user", content: userPrompt },
            ],
            {
                proxyUrl: APP_CONFIG.PROXY_URL,
                model: APP_CONFIG.MODEL,
                temperature: APP_CONFIG.ICH_BOTSCHAFT_TEMPERATURE,
            }
        );

        if (data) {
            const feedback = data.choices[0].message.content;
            UI.appendMessage(feedback, "partner", {
                roleName: config.roleName,
                messageType: "feedback",
                isIchMode: true,
            });
            Chat.add("assistant", feedback);

            DataLogger.addTurn("assistant", feedback, {
                roleName: config.roleName,
                messageType: "feedback",
                mode: STATE.currentMode,
                scenarioId: config.id
            });

            if (STATE.ttsEnabled) UI.speak(feedback, config.roleName);
        }
    } catch (e) {
        console.error("Direct Feedback Error:", e);
    } finally {
        UI.hideTypingIndicator();
        UI.updateInputUI(false, UI_TEXTS.input.retryOrContinue);
        if (UI.elements.nextTaskBtn) {
            UI.elements.nextTaskBtn.classList.remove("hidden");
        }
    }
}



/**
 * Main message handler for transformation mode.
 * @returns {Promise<void>}
 */
export async function handleSend() {
    const userVal = UI.elements.userInput.value.trim();
    const config = prepareMessageSend(userVal);

    if (!config) return;

    // Enable sidebar buttons on first interaction
    enableSidebarButtons();

    await handleTransformationSend(config);
}

/**
 * Switches to the next statement in transformation mode.
 * @returns {void}
 */
export function handleNextExercise() {
    const config = ScenarioService.getActive();
    if (!config) return;

    UI.elements.nextTaskBtn?.classList.add("hidden");
    STATE.exerciseIndex++;

    // Clear input and update UI (disables send button automatically)
    UI.elements.userInput.value = "";
    UI.updateInputUI(false, "");

    if (STATE.exerciseIndex < STATE.activeStatements.length) {
        const nextStatement = STATE.activeStatements[STATE.exerciseIndex];
        const taskText = `"${nextStatement}"\n\n${config.shortInstruction}`;

        appendPartnerMessage(taskText, config, { shouldScroll: false });

        if (STATE.ttsEnabled) UI.speak(taskText, config.roleName);
        updateInputAndStatus(false, UI_TEXTS.input.transformationNext, "idle", getTransformationProgressText());
    } else {
        const endMsg = UI_TEXTS.status.allExercisesDone;
        UI.appendMessage(endMsg, "partner", {
            roleName: config.roleName,
            messageType: "task",
            isIchMode: true,
        });
        updateInputAndStatus(true, UI_TEXTS.input.allDone, "idle", UI_TEXTS.status.exerciseComplete);
    }
}