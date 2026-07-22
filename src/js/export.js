/**
 * @module Export
 * Handles data export functionality for research purposes.
 */

import { DataLogger } from './dataLogger.js';
import { UI } from './ui.js';
import { Utils } from './utils.js';
import { Chat } from './chat.js';
import { ScenarioService } from './scenario.js';

/**
 * Downloads the current chat transcript as a text file.
 */
export function downloadCurrentTranscript() {
  const config = ScenarioService.getActive();
  if (!config) return;

  const STATE = window.STATE;
  const isTransform = STATE.currentMode === "transformation";
  const briefing = UI.elements.briefingContent?.innerText.trim() || "";
  
  let fileContent = `PROTOKOLL: ${config.title}\n`;
  fileContent += `Modus: ${isTransform ? "Transformationstraining" : "Simulation"}\n`;
  fileContent += `Datum: ${new Date().toLocaleString()}\n`;
  fileContent += `==========================================\n\n`;
  
  fileContent += `### 1. BRIEFING / AUFGABE ###\n\n${briefing}\n\n`;
  fileContent += `==========================================\n\n`;
  fileContent += `### 2. CHAT-VERLAUF ###\n\n`;

  const history = Chat.getHistory();
  history.forEach(msg => {
    let sender = msg.role === "user" ? "Ich" : config.roleName;
    if (isTransform && msg.role === "assistant" && !msg.content.includes('"')) {
      sender = "Coach-Feedback";
    }
    fileContent += `${sender}:\n${msg.content}\n\n`;
  });

  if (STATE.lastFeedback) {
    fileContent += `==========================================\n\n`;
    fileContent += `### 3. ABSCHLIESSENDE ANALYSE ###\n\n${STATE.lastFeedback}\n`;
  }

  const date = Utils.getFormattedDate();
  const modePrefix = isTransform ? "Transformation" : "Simulation";
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
    UI.updateStatus("idle", `Upload abgeschlossen: ${result.success} erfolgreich, ${result.failed} fehlgeschlagen`);
    if (result.failed > 0) {
      UI.updateStatus("warning", `${result.failed} Konversationen konnten nicht hochgeladen werden.`);
    }
  } catch (error) {
    UI.updateStatus("error", "Fehler beim Hochladen: " + error.message);
  }
}

/**
 * Displays research statistics.
 */
export function showResearchStats() {
  const stats = DataLogger.getStatistics();
  alert(`📊 Statistiken:\n\n` +
    `Gesamt Konversationen: ${stats.totalConversations}\n` +
    `Gesamt Dialogschritte: ${stats.totalTurns}\n` +
    `Aktuelle Konversation: ${stats.currentConversationId || 'Keine'}\n` +
    `Ausstehende Uploads: ${stats.pendingUploads}\n` +
    `Backend konfiguriert: ${stats.backendConfigured ? 'Ja' : 'Nein'}`);
}

/**
 * Downloads all dialogue data from the server.
 */
export function downloadAllFromServer() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (!token) {
    alert('Fehler: Kein Forscher-Token vorhanden');
    return;
  }
  try {
    window.location.href = `https://kite2.site/dialogue_lab/download_dialogues.php?token=${token}`;
  } catch (error) {
    alert('Fehler: ' + error.message);
  }
}

// Make globally available for onclick attributes
window.downloadCurrentTranscript = downloadCurrentTranscript;
window.exportResearchData = exportResearchData;
window.exportCurrentResearchData = exportCurrentResearchData;
window.uploadAllResearchData = uploadAllResearchData;
window.showResearchStats = showResearchStats;
window.downloadAllFromServer = downloadAllFromServer;
