/**
 * @module ContentLoader
 * Handles loading of transformation exercise content.
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "./dataLogger.js";
import { EXERCISE_TYPES, UI_TEXTS, APP_MODES } from "../core/config.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE } from "../core/state.js";
import { Utils } from "../utils/utils.js";
import { getProfilePool } from "../features/profiles.js";
import { appendPartnerMessage } from "../ui/uiHelpers.js";
import { getTransformationProgressText } from "../utils/messageHandlers.js";
import { setupSystemPrompt } from "../core/promptBuilder.js";

/**
 * Main entry point for loading transformation exercises.
 * Fetches data via ScenarioService and updates UI components, avatars, and briefing.
 *
 * @async
 * @param {string} exerciseId - The ID of the exercise to load.
 */
export async function loadContent(exerciseId) {
    UI.updateStatus("loading", UI_TEXTS.status.loading);
    UI.setBriefingLoading(true);
    UI.elements.chatWindow.innerHTML = "";

    STATE.lastFeedback = null;

    try {
        const config = await ScenarioService.loadScenario(exerciseId);

        // Set up system prompt with centralized prompt management
        setupSystemPrompt(APP_MODES.TRANSFORMATION, config);

        DataLogger.updateConversationMetadata({
            mode: STATE.currentMode,
            scenarioId: config.id,
            scenarioTitle: config.title,
            scenarioType: config.type
        });

        if (UI.elements.partnerNameDisplay) {
            UI.elements.partnerNameDisplay.textContent = config.roleName;
        }

        const profileKey = config.roleLabel || config.roleName;
        const profilePool = getProfilePool(profileKey);
        await UI.initAvatar(profilePool);

        STATE.activeStatements = ScenarioService.getStatements(true);
        STATE.exerciseIndex = 0;

        document.getElementById("main-subtitle").textContent =
            UI_TEXTS.subtitles.transformation(config.title, config.shortInstruction);

        const first = STATE.activeStatements[0];
        const taskText = `"${first}"\n\n${config.shortInstruction}`;
        appendPartnerMessage(taskText, config);

        Utils.renderBoldMarkdownWithLineBreaks(UI.elements.briefingContent, config.instructionSection);

        if (STATE.ttsEnabled) UI.speak(config.instructionSection, UI_TEXTS.tts.briefingLabel);
        UI.elements.chevron.style.transform = "rotate(0deg)";
        UI.updateInputUI(
            false,
            UI_TEXTS.input.transformation,
        );
        UI.updateStatus("idle", getTransformationProgressText());
    } catch (error) {
        console.error("Content loading failed:", error);
        UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">${UI_TEXTS.errors.contentLoadingError}.</p>`;
        UI.updateStatus("error", UI_TEXTS.errors.contentLoadingError);
    }
}