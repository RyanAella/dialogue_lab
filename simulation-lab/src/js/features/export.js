/**
 * @module Export
 * Handles data export functionality for research purposes.
 */

import { DataLogger } from '../services/dataLogger.js';
import { UI } from '../ui/ui.js';
import { Utils } from '../utils/utils.js';
import { Chat } from './chat.js';
import { ScenarioService } from './scenario.js';
import { EXERCISE_TYPES, EXPORT_MESSAGES } from '../core/config.js';

/**
 * Downloads the current chat transcript as a text file.
 */
export function downloadCurrentTranscript() {
    const config = ScenarioService.getActive();
    if (!config) return;

    const STATE = window.STATE;
    const isTransform = STATE.currentMode === EXERCISE_TYPES.TRANSFORMATION;
    const briefing = UI.elements.briefingContent?.innerText.trim() || "";
    const dateString = new Date().toLocaleString();
    const modeLabel = isTransform
        ? EXPORT_MESSAGES.modeLabels.transformation.display
        : EXPORT_MESSAGES.modeLabels.simulation.display;

    let fileContent = `${EXPORT_MESSAGES.transcript.header}${config.title}\n`;
    fileContent += `${EXPORT_MESSAGES.transcript.modeLabel}${modeLabel}\n`;
    fileContent += `${EXPORT_MESSAGES.transcript.dateLabel}${dateString}\n`;
    fileContent += EXPORT_MESSAGES.transcript.divider;

    fileContent += `${EXPORT_MESSAGES.transcript.sections.briefing}${briefing}\n\n`;
    fileContent += EXPORT_MESSAGES.transcript.divider;
    fileContent += EXPORT_MESSAGES.transcript.sections.chat;

    const history = Chat.getHistory();
    history.forEach(msg => {
        let sender = msg.role === "user"
            ? EXPORT_MESSAGES.transcript.senders.user
            : config.roleName;
        if (isTransform && msg.role === "assistant" && !msg.content.includes('"')) {
            sender = EXPORT_MESSAGES.transcript.senders.coach;
        }
        fileContent += `${sender}:\n${msg.content}\n\n`;
    });

    if (STATE.lastFeedback) {
        fileContent += EXPORT_MESSAGES.transcript.divider;
        fileContent += `${EXPORT_MESSAGES.transcript.sections.analysis}${STATE.lastFeedback}\n`;
    }

    const date = Utils.getFormattedDate();
    const modePrefix = isTransform
        ? EXPORT_MESSAGES.modeLabels.transformation.filePrefix
        : EXPORT_MESSAGES.modeLabels.simulation.filePrefix;
    let filenameParts = [modePrefix];
    const activeSelect = isTransform
        ? UI.elements.exerciseSelect
        : UI.elements.scenarioSelect;

    if (activeSelect && activeSelect.selectedIndex > 0) {
        const scenarioTitle = Utils.slugify(activeSelect.options[activeSelect.selectedIndex].text);
        filenameParts.push(scenarioTitle);
    }
    filenameParts.push(date);
    const filename = filenameParts.join("_") + ".txt";
    Utils.downloadFile(fileContent, filename);
}

/**
 * Exports all conversations for research purposes.
 * @param {string} format - 'json', 'csv', or any other for current conversation
 */
export function exportResearchData(format = "json") {
    if (format === "json") {
        DataLogger.exportAllAsJSON("dialogue_lab_research");
    } else if (format === "csv") {
        DataLogger.exportAllAsCSV("dialogue_lab_research");
    } else {
        DataLogger.exportCurrentAsJSON("dialogue_lab_current");
    }
}

/**
 * Exports current conversation for research purposes.
 */
export function exportCurrentResearchData() {
    DataLogger.exportCurrentAsJSON("dialogue_lab_current_conversation");
}

/**
 * Uploads all locally stored conversations to the backend server.
 * @async
 */
export async function uploadAllResearchData() {
    try {
        const result = await DataLogger.uploadAllConversations();
        UI.updateStatus("idle", EXPORT_MESSAGES.status.uploadSuccess(result.success, result.failed));
        if (result.failed > 0) {
            UI.updateStatus("warning", EXPORT_MESSAGES.status.uploadWarning(result.failed));
        }
    } catch (error) {
        UI.updateStatus("error", EXPORT_MESSAGES.status.uploadError(error.message));
    }
}

/**
 * Displays research statistics.
 */
export function showResearchStats() {
    const stats = DataLogger.getStatistics();
    alert(EXPORT_MESSAGES.alerts.researchStats(stats));
}

/**
 * Downloads all dialogue data from the server.
 */
export function downloadAllFromServer() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (!token) {
        alert(EXPORT_MESSAGES.alerts.noToken);
        return;
    }
    try {
        window.location.href = `https://kite2.site/dialogue_lab/download_dialogues.php?token=${token}`;
    } catch (error) {
        alert(EXPORT_MESSAGES.alerts.downloadError(error.message));
    }
}

// Make globally available for onclick attributes
window.downloadCurrentTranscript = downloadCurrentTranscript;
window.exportResearchData = exportResearchData;
window.exportCurrentResearchData = exportCurrentResearchData;
window.uploadAllResearchData = uploadAllResearchData;
window.showResearchStats = showResearchStats;
window.downloadAllFromServer = downloadAllFromServer;