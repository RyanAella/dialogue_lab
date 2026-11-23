/**
 * @module ResearcherMenu
 * Handles the researcher menu UI and token management.
 */

import { DATA_LOGGER_CONFIG, APP_CONFIG } from "../core/config.js";
import { DataLogger } from "../services/dataLogger.js";

const { STORAGE_KEYS } = DATA_LOGGER_CONFIG;

// Load JSZip from CDN for ZIP export
let JSZip;
async function loadJSZip() {
  if (!JSZip) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    JSZip = window.JSZip;
  }
  return JSZip;
}

/**
 * Creates a ZIP file from multiple JSON files.
 * @param {Array} conversations - Array of conversation data
 * @param {string} filenamePrefix - Prefix for the ZIP filename
 * @returns {Promise<void>}
 */
async function downloadAsZIP(conversations, filenamePrefix = "dialogue_lab_researcher") {
  try {
    const JSZipLib = await loadJSZip();
    const zip = new JSZipLib();
    
    conversations.forEach((conversation, index) => {
      const filename = `${conversation.metadata?.mode || 'conversation'}_${conversation.metadata?.scenarioId || 'unknown'}_${index + 1}.json`;
      const content = JSON.stringify(conversation, null, 2);
      zip.file(filename, content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating ZIP:', error);
    // Fallback to JSON export
    alert('ZIP-Export fehlgeschlagen. Verwende stattdessen JSON-Export.');
    DataLogger.exportAllAsJSON(filenamePrefix);
  }
}

/**
 * Opens the admin token dialog and, on confirm, deletes all server dialogue logs.
 * The admin token is deliberately NOT taken from the URL or localStorage;
 * it is entered manually and held in memory only for the duration of the request.
 */
async function deleteServerData() {
  const adminToken = promptAdminToken();
  if (!adminToken) return; // dialog cancelled

  const backendUrl = DataLogger._backendEndpoint || APP_CONFIG.DATALOGGER_BACKEND;
  if (!backendUrl) {
    alert('❌ Backend-Endpoint nicht konfiguriert.');
    return;
  }
  const deleteEndpoint = backendUrl.replace('save_dialogue.php', 'delete_dialogue.php');

  try {
    // 1) Dry run: how many files would be deleted?
    const countRes = await fetch(deleteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
      body: JSON.stringify({ action: 'count' })
    });
    if (countRes.status === 429) { alert('⛔ Zu viele Versuche. Bitte später erneut versuchen.'); return; }
    if (countRes.status === 403) { alert('❌ Admin-Token ungültig.'); return; }
    if (!countRes.ok) throw new Error(`Server: ${countRes.status}`);
    const countData = await countRes.json();
    const n = countData.count ?? 0;

    // 2) Explicit confirm with real number
    if (!confirm(`Es werden ${n} gespeicherte Konversation(en) auf dem Server UNWIDERRUFLICH gelöscht. Fortfahren?`)) return;

    // 3) Delete
    const res = await fetch(deleteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
      body: JSON.stringify({ action: 'delete_all' })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `Server: ${res.status}` }));
      throw new Error(errorData.error || `Server: ${res.status}`);
    }
    const result = await res.json();
    alert(result.success ? `✅ Server-Daten gelöscht!\n${result.deleted || 0} Dateien entfernt.` : `❌ ${result.error}`);
  } catch (error) {
    alert(`❌ Fehler beim Löschen: ${error.message}`);
  }
}

/**
 * Minimal dialog that asks for the admin token.
 * Returns the token or null if cancelled/empty.
 */
function promptAdminToken() {
  const token = window.prompt('Admin-Token für Server-Löschung eingeben:');
  return token && token.trim() ? token.trim() : null;
}

/**
 * Displays researcher statistics.
 */
function showResearcherStats() {
  const allConversations = DataLogger._allConversations || [];
  const failedUploads = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAILED_UPLOADS) || '[]');
  
  const stats = {
    totalConversations: allConversations.length,
    totalTurns: allConversations.reduce((sum, conv) => sum + (conv.turns?.length || 0), 0),
    currentConversationId: DataLogger._currentConversationId || 'Keine',
    autoUpload: DataLogger.config.autoUpload,
    backendConfigured: !!DataLogger._backendEndpoint,
    pendingUploads: failedUploads.length
  };
  
  alert(`📊 Statistiken:\n\n` +
    `Gesamt Konversationen: ${stats.totalConversations}\n` +
    `Gesamt Dialogschritte: ${stats.totalTurns}\n` +
    `Aktuelle Konversation: ${stats.currentConversationId}\n` +
    `Ausstehende Uploads: ${stats.pendingUploads}\n` +
    `Backend konfiguriert: ${stats.backendConfigured ? 'Ja' : 'Nein'}`);
}

/**
 * Checks if a researcher token is present in the URL.
 * @returns {boolean}
 */
function hasResearcherToken() {
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('token');
}

/**
 * Creates the researcher menu UI element.
 */
function createResearcherMenu() {
  // Check if menu already exists
  if (document.getElementById('researcher-menu')) {
    return;
  }
  
  const menu = document.createElement('div');
  menu.id = 'researcher-menu';
  menu.className = 'fixed bottom-4 right-4 z-[120] bg-white rounded-xl shadow-2xl border border-blue-200 p-4 max-w-xs w-64';
  menu.style.display = 'none';
  
  menu.innerHTML = `
    <div class="flex items-center justify-between mb-3 border-b border-blue-100 pb-2">
      <h3 class="font-bold text-blue-800">🔬 Forscher-Menü</h3>
      <button id="researcher-menu-close" class="text-blue-400 hover:text-blue-600 text-xl" title="Schließen">&times;</button>
    </div>
    <div class="space-y-2">
      <button id="researcher-export-zip" class="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
        <span>📦</span> Alle als ZIP
      </button>
      <button id="researcher-export-json" class="w-full flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-sm transition-colors">
        <span>📄</span> Alle als JSON
      </button>
      <div class="border-t border-blue-100 my-2"></div>
      <button id="researcher-delete-server" class="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
        <span>🗑️</span> Server-Daten löschen
      </button>
      <div class="border-t border-blue-100 my-2"></div>
      <button id="researcher-stats" class="w-full flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm transition-colors">
        <span>ℹ️</span> Statistiken
      </button>
    </div>
    <div class="mt-3 pt-3 border-t border-blue-100 text-[10px] text-blue-500 text-center">
      Forscher-Token aktiv · Export: URL-Token · Löschen: Admin-Token
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Add event listeners
  document.getElementById('researcher-menu-close')?.addEventListener('click', () => {
    menu.style.display = 'none';
  });
  
  document.getElementById('researcher-export-zip')?.addEventListener('click', () => {
    const all = DataLogger._allConversations || [];
    downloadAsZIP(all, 'dialogue_lab_researcher');
  });
  
  document.getElementById('researcher-export-json')?.addEventListener('click', () => {
    DataLogger.exportAllAsJSON('dialogue_lab_researcher');
  });

  document.getElementById('researcher-delete-server')?.addEventListener('click', () => {
    deleteServerData();
  });
  
  document.getElementById('researcher-stats')?.addEventListener('click', showResearcherStats);
}

/**
 * Creates the researcher menu toggle button.
 */
function createResearcherToggleButton() {
  // Check if button already exists
  if (document.getElementById('researcher-toggle')) {
    return;
  }
  
  const btn = document.createElement('button');
  btn.id = 'researcher-toggle';
  btn.className = 'fixed bottom-4 right-4 z-[115] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-2xl transition-all hidden';
  btn.title = 'Forscher-Menü öffnen';
  btn.innerHTML = '<span class="text-xl">🔬</span>';
  
  btn.addEventListener('click', () => {
    const menu = document.getElementById('researcher-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  document.body.appendChild(btn);
}

/**
 * Checks if researcher token exists in URL and shows/hides the menu accordingly.
 */
function checkAndShowResearcherMenu() {
  const hasToken = hasResearcherToken();
  const toggleBtn = document.getElementById('researcher-toggle');
  
  if (toggleBtn) {
    toggleBtn.classList.toggle('hidden', !hasToken);
  }
}

/**
 * Initializes the researcher menu.
 */
export function initResearcherMenu() {
  createResearcherToggleButton();
  createResearcherMenu();
  checkAndShowResearcherMenu();
}
