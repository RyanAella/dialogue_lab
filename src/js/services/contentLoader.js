/**
 * @module ContentLoader
 * Handles loading of scenario and exercise content.
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "./dataLogger.js";
import { UI_TEXTS, PROMPT_TEMPLATES } from "../core/config.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE } from "../core/state.js";
import { Utils } from "../utils/utils.js";
import { getProfilePool } from "../features/profiles.js";
import {Chat} from "../features/chat.js";

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

    STATE.lastFeedback = null;

    try {
        const config = await ScenarioService.loadScenario(exerciseId);

        // Setze System-Prompt mit Warte-Anweisung AM ENDE (höchste Priorität in OpenAI)
        Chat.setSystemPrompt(
            `${PROMPT_TEMPLATES.roleplay.roleAdherence}\n\n${config.prompts.system}\n\n${config.prompts.partner}\n\nKRITISCHE REGEL: Warte immer, bis der Benutzer das Thema explizit einführt. Reagiere NUR auf das, was der Nutzer sagt. Beginne NIE von selbst Gespräche, führe NIE Themen ein und übernimm NIE die Initiative. Dein einziges Ziel ist es, auf die Eingaben des Nutzers zu antworten.`
        );

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

        UI.elements.startInfo.classList.remove("hidden");
        UI.elements.chatWindow.appendChild(UI.elements.startInfo);

        Utils.renderBoldMarkdownWithLineBreaks(UI.elements.briefingContent, config.instructionSection);

        if (STATE.ttsEnabled) UI.speak(config.instructionSection, UI_TEXTS.tts.briefingLabel);
        UI.elements.chevron.style.transform = "rotate(0deg)";
        UI.updateInputUI(
            false,
            UI_TEXTS.input.roleplay(config.roleName),
        );
        UI.updateStatus("idle", UI_TEXTS.status.ready);
    } catch (error) {
        console.error("Content loading failed:", error);
        UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">${UI_TEXTS.errors.contentLoadingError}.</p>`;
        UI.updateStatus("error", UI_TEXTS.errors.contentLoadingError);
    }
}