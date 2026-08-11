/**
 * @module MessageHandlers
 * Handles mode-specific message sending logic for transformation and roleplay modes.
 */

import { API } from "../services/api.js";
import { Chat } from "../features/chat.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_CONFIG, UI_TEXTS } from "../core/config.js";
import { UI } from "../ui/ui.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE, enableSidebarButtons } from "../core/state.js";
import { appendPartnerMessage, updateInputAndStatus } from "../ui/uiHelpers.js";
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
 * Handles message sending in ROLEPLAY mode.
 * Manages real-time conversation with the AI partner.
 * @param {Object} config - The scenario configuration
 * @returns {Promise<void>}
 */
export async function handleRoleplaySend(config) {
    UI.updateInputUI(true, UI_TEXTS.status.sending, "loading", UI_TEXTS.status.sending);
    UI.showTypingIndicator(config.roleName);

    const messages = Chat.getHistory();

    try {
        const data = await API.callChatApi(messages, {
            proxyUrl: APP_CONFIG.PROXY_URL,
            model: APP_CONFIG.MODEL,
            temperature: APP_CONFIG.CHAT_TEMPERATURE,
        });
        if (!data) return;

        const botResp = data.choices[0].message.content;
        UI.appendMessage(botResp, "partner", { roleName: config.roleName });
        Chat.add("assistant", botResp);

        DataLogger.addTurn("assistant", botResp, {
            roleName: config.roleName,
            mode: STATE.currentMode,
            scenarioId: config.id
        });

        if (STATE.ttsEnabled) UI.speak(botResp, config.roleName);
        UI.updateStatus("idle", UI_TEXTS.status.ready);
    } catch (e) {
        UI.updateStatus("error", e.message);
    } finally {
        UI.hideTypingIndicator();
        UI.updateInputUI(false, UI_TEXTS.input.roleplay(config.roleName));
        UI.elements.userInput.focus();
    }
}

/**
 * Main message handler that routes to mode-specific handlers.
 * @returns {Promise<void>}
 */
export async function handleSend() {
    const userVal = UI.elements.userInput.value.trim();
    const config = prepareMessageSend(userVal);

    if (!config) return;

    // Enable sidebar buttons on first interaction
    enableSidebarButtons();

    await handleRoleplaySend(config);
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