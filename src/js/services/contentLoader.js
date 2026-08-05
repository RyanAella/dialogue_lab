/**
 * @module ContentLoader
 * Handles loading of scenario and exercise content.
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "./dataLogger.js";
import { EXERCISE_TYPES, UI_TEXTS } from "../core/config.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE } from "../core/state.js";
import { Utils } from "../utils/utils.js";
import { getProfilePool } from "../features/profiles.js";
import { appendPartnerMessage } from "../ui/uiHelpers.js";
import { getTransformationProgressText } from "../utils/messageHandlers.js";

/**
 * Main entry point for loading specific content (scenarios or exercises).
 * Fetches data via ScenarioService and updates UI components, avatars, and briefing.
 *
 * @async
 * @param {string} exerciseId - The ID of the content to load.
 */
export async function loadContent(exerciseId) {
    UI.updateStatus("loading", UI_TEXTS.status.loading);
    UI.setBriefingLoading(true);
    UI.elements.chatWindow.innerHTML = "";
    // Feedback button remains visible but stays disabled until first message
    // UI.setExerciseActionsVisible(false);

    STATE.lastFeedback = null;

    try {
        const config = await ScenarioService.loadScenario(exerciseId);

        DataLogger.updateConversationMetadata({
            mode: STATE.currentMode,
            scenarioId: config.id,
            scenarioTitle: config.title,
            scenarioType: config.type
        });

        const isTransform = config.type === EXERCISE_TYPES.TRANSFORMATION;

        if (UI.elements.partnerNameDisplay) {
            UI.elements.partnerNameDisplay.textContent = config.roleName;
        }

        const profileKey = config.roleLabel || config.roleName;
        const profilePool = getProfilePool(profileKey);
        await UI.initAvatar(profilePool);

        if (isTransform) {
            STATE.activeStatements = ScenarioService.getStatements(true);
            STATE.exerciseIndex = 0;

            document.getElementById("main-subtitle").textContent =
                UI_TEXTS.subtitles.transformation(config.title, config.shortInstruction);

            const first = STATE.activeStatements[0];
            const taskText = `"${first}"\n\n${config.shortInstruction}`;
            appendPartnerMessage(taskText, config);
        } else {
            UI.elements.startInfo.classList.remove("hidden");
            UI.elements.chatWindow.appendChild(UI.elements.startInfo);
        }

        Utils.renderBoldMarkdownWithLineBreaks(UI.elements.briefingContent, config.instructionSection);

        if (STATE.ttsEnabled) UI.speak(config.instructionSection, UI_TEXTS.tts.briefingLabel);
        UI.elements.chevron.style.transform = "rotate(0deg)";
        UI.updateInputUI(
            false,
            isTransform ? UI_TEXTS.input.transformation : UI_TEXTS.input.roleplay(config.roleName),
        );
        UI.updateStatus("idle", isTransform ? getTransformationProgressText() : UI_TEXTS.status.ready);
    } catch (error) {
        console.error("Content loading failed:", error);
        UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">${UI_TEXTS.errors.contentLoadingError}.</p>`;
        UI.updateStatus("error", UI_TEXTS.errors.contentLoadingError);
    }
}