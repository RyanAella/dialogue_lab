import { API } from "./api.js";
import { APP_CONFIG } from "./config.js";
import { getProfilePool } from "./profiles.js";
import { UI } from "./ui.js";
import { Utils } from "./utils.js";

// =========================================================
// 1. Configuration & State
// =========================================================
const STATE = {
  config: {
    systemPrompt: "",
    partnerPrompt: "",
    mentorPrompt: "",
    roleName: "Teammitglied",
  },
  chatHistory: [],
  currentMode: "roleplay",
  allExercises: [],
  ttsEnabled: false,
};

/**
 * Resets UI and state for a mode change
 */
function resetAppForMode(mode) {
  STATE.currentMode = "roleplay";
  STATE.chatHistory = [];
  UI.elements.chatWindow.innerHTML = "";
  UI.elements.chatWindow.closest("main")?.scrollTo(0, 0);
  UI.elements.briefingContent.classList.remove("hidden");
  UI.setBriefingExpanded(true);
  UI.setModeBadge();

  if (UI.elements.feedbackBtn) {
    UI.elements.feedbackBtn.classList.remove("hidden");
    UI.elements.feedbackBtn.disabled = true;
    UI.elements.feedbackBtn.classList.add("opacity-50", "cursor-not-allowed");
    UI.elements.feedbackBtn.innerHTML = "<span>📊</span> Feedback erhalten";
  }

  if (UI.elements.exportTranscriptBtn)
    UI.elements.exportTranscriptBtn.classList.add("hidden");
  if (UI.elements.resetBtn) {
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

async function loadExercises() {
  try {
    const url = `${APP_CONFIG.EXERCISES_FILE}?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Exercises file could not be loaded");
    }

    const data = await response.json();
    if (!Array.isArray(data))
      throw new Error("Exercises file is not a valid JSON array.");
    STATE.allExercises = data;
  } catch (error) {
    console.error("Fehler beim Laden der Übungen:", error);
    UI.updateStatus("error", `Fehler: ${error.message}`);
    UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">Fehler: ${error.message}</p>`;
    UI.updateInputUI(true, "Fehler beim Laden.");
  }
}

/**
 * Generic helper to reset buttons when switching modes
 */
async function switchToRoleplayMode() {
  resetAppForMode("roleplay");
  UI.elements.briefingContent.textContent = "Szenario wird geladen...";
  UI.updateInputUI(true, "Wähle ein Szenario...");

  await initScenarioDropdown();

  const simulationExercises = STATE.allExercises.filter(
    (ex) => ex.type === "SIMULATION",
  );
  if (simulationExercises.length > 0) {
    // If no scenario is currently selected, or the selected one is not a simulation, select the first simulation
    if (
      !UI.elements.scenarioSelect.value ||
      !simulationExercises.some(
        (ex) => ex.id === UI.elements.scenarioSelect.value,
      )
    ) {
      UI.elements.scenarioSelect.value = simulationExercises[0].id;
    }
    UI.elements.scenarioSelect.dispatchEvent(new Event("change"));
  } else {
    UI.updateStatus("idle", "Keine Rollenspiel-Szenarien verfügbar.");
  }

  document.getElementById("main-subtitle").textContent =
    "Lies das Briefing und starte das Gespräch mit einer Nachricht.";
  UI.updateStatus("idle", "Simulationen aktiv");
}

// =========================================================
// 2. Scenario & Dropdown Logic
// =========================================================

/**
 * Unified helper to initialize dropdowns (DRY principle)
 */
async function initDropdown(type, selectElement, placeholder) {
  if (!selectElement) return;

  selectElement.innerHTML = `<option value="" selected disabled>${placeholder}</option>`;
  const filtered = STATE.allExercises.filter((ex) => ex.type === type);

  if (filtered.length === 0) {
    selectElement.innerHTML =
      '<option value="" disabled>Keine Einträge verfügbar</option>';
    selectElement.disabled = true;
    return;
  }

  for (const ex of filtered) {
    try {
      // Use scenarioFile for simulations, instructionFile for transformations
      const filePath = ex.config.scenarioFile || ex.config.instructionFile;
      const title = (await API.fetchScenarioTitle(filePath)) || ex.id;
      selectElement.add(new Option(title, ex.id));
    } catch (e) {
      console.error(`Metadata load error for ${ex.id}:`, e);
    }
  }
  selectElement.disabled = false;
}

async function initScenarioDropdown() {
  await initDropdown(
    "SIMULATION",
    UI.elements.scenarioSelect,
    "Wähle ein Szenario...",
  );
}

/**
 * Unified loader for both Roleplay and Transformation content
 */
async function loadContent(exerciseId) {
  const exercise = STATE.allExercises.find((ex) => ex.id === exerciseId);
  if (!exercise) return;
  const exConfig = exercise.config;

  UI.updateStatus("loading", "Lade...");
  UI.setBriefingLoading(true);
  UI.elements.chatWindow.innerHTML = "";
  STATE.chatHistory = [];

  try {
    const fileToLoad = exConfig.scenarioFile;
    const data = await API.fetchCompleteScenario(fileToLoad);

    // Common metadata
    STATE.config.roleName = Utils.extractRoleName(
      data.instructionSection,
      data.roleLabel,
    );
    STATE.config.systemPrompt = data.prompts.system;
    STATE.config.partnerPrompt = data.prompts.partner;
    STATE.config.mentorPrompt = data.prompts.mentor;
    STATE.config.shortInstruction =
      data.shortInstruction || "Bearbeite die Aussage.";

    // Update Avatar Display Name
    const nameEl = document.getElementById("partner-name-display");
    if (nameEl) nameEl.textContent = STATE.config.roleName;

    // Passendes Character-Profil finden und initialisieren
    const profileKey = data.roleLabel || STATE.config.roleName;
    const profilePool = getProfilePool(profileKey);

    // initAvatar wählt nun zufällig ein Set aus dem Pool (Array) aus
    UI.initAvatar(profilePool);

    // Roleplay specific UI updates
    UI.elements.startInfo.classList.remove("hidden");
    UI.elements.chatWindow.appendChild(UI.elements.startInfo);

    Utils.renderBoldMarkdownWithLineBreaks(
      UI.elements.briefingContent,
      data.instructionSection,
    );

    if (STATE.ttsEnabled) UI.speak(data.instructionSection, "Briefing");
    UI.elements.chevron.style.transform = "rotate(0deg)";
    UI.updateInputUI(false, `Nachricht an ${STATE.config.roleName}...`);
    UI.updateStatus("idle", "Bereit");
  } catch (error) {
    console.error("Content loading failed:", error);
    UI.elements.briefingContent.innerHTML =
      '<p class="text-red-500 p-4">Ladefehler.</p>';
    UI.updateStatus("error", "Ladefehler");
  }
}

// Function to download the current chat transcript
function downloadCurrentTranscript() {
  const briefing = UI.elements.briefingContent?.innerText.trim() || "";
  const header = `### BRIEFING ###\n\n${briefing}\n\n${"=".repeat(50)}\n\n### PROTOKOLL ###\n\n`;
  const chatContent = Utils.generateTranscript(
    STATE.chatHistory,
    STATE.config.roleName,
  );

  const blob = new Blob([header + chatContent], {
    type: "text/plain;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);

  const date = Utils.getFormattedDate();
  let filenameParts = [];

  // Modus hinzufügen
  const modePrefix =
    STATE.currentMode === "roleplay" ? "Simulation" : "Transformation";
  filenameParts.push(modePrefix);

  // Szenario-Titel hinzufügen
  let scenarioTitle = "";
  const activeSelect =
    STATE.currentMode === "transformation"
      ? UI.elements.exerciseSelect
      : UI.elements.scenarioSelect;

  if (activeSelect && activeSelect.selectedIndex > 0) {
    scenarioTitle = Utils.slugify(
      activeSelect.options[activeSelect.selectedIndex].text,
    );
  }
  if (scenarioTitle) filenameParts.push(scenarioTitle);

  filenameParts.push(date);
  a.download = `${filenameParts.join("_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

async function handleSend() {
  const userVal = UI.elements.userInput.value.trim();
  if (!userVal) return;

  UI.prepareForInteraction();
  UI.appendMessage(userVal, "user", { isIchMode: false });
  if (STATE.ttsEnabled) UI.speak(userVal, "Ich");
  STATE.chatHistory.push({ role: "user", content: userVal });
  UI.elements.userInput.value = "";

  // Enable sidebar buttons on first interaction
  [UI.elements.feedbackBtn, UI.elements.resetBtn].forEach((btn) => {
    // Activate both buttons
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });

  // Simulation Mode: Real-time conversation
  UI.updateInputUI(true, "Sende...");
  UI.updateStatus("loading", "Antworten...");
  UI.showTypingIndicator(STATE.config.roleName);

  if (STATE.chatHistory.filter((m) => m.role === "system").length === 0) {
    STATE.chatHistory.unshift({
      role: "system",
      content: `${STATE.config.systemPrompt}\n\n${STATE.config.partnerPrompt}`,
    });
  }

  try {
    const data = await API.callChatApi(STATE.chatHistory, {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: APP_CONFIG.CHAT_TEMPERATURE,
    });
    if (!data) return;
    UI.hideTypingIndicator();
    const botResp = data.choices[0].message.content;
    UI.appendMessage(botResp, "partner", { roleName: STATE.config.roleName });
    STATE.chatHistory.push({ role: "assistant", content: botResp });
    if (STATE.ttsEnabled) UI.speak(botResp, STATE.config.roleName);
    UI.updateStatus("idle", "Bereit");
  } catch (e) {
    UI.hideTypingIndicator();
    UI.updateStatus("error", e.message);
  } finally {
    UI.updateInputUI(false, `Message to ${STATE.config.roleName}...`);
    UI.elements.userInput.focus();
  }
}

async function handleFeedback() {
  if (STATE.chatHistory.length === 0) return;

  UI.elements.loadingOverlay.classList.remove("hidden");
  UI.updateStatus("loading", "Mentor analyzing...");
  const transcript = Utils.generateTranscript(
    STATE.chatHistory,
    STATE.config.roleName,
  );

  try {
    const data = await API.callChatApi(
      [
        { role: "system", content: STATE.config.mentorPrompt },
        { role: "user", content: `Transcript:\n${transcript}` },
      ],
      {
        proxyUrl: APP_CONFIG.PROXY_URL,
        model: APP_CONFIG.MODEL,
        temperature: APP_CONFIG.MENTOR_TEMPERATURE,
      },
    );
    UI.showFeedbackModal(data.choices[0].message.content);
    if (STATE.ttsEnabled) UI.speak(data.choices[0].message.content, "Mentor");

    // Optional: Also show the download button in the sidebar after mentor feedback
    UI.elements.feedbackBtn.classList.add("hidden");
    if (UI.elements.exportTranscriptBtn) {
      UI.elements.exportTranscriptBtn.classList.remove("hidden");
    }

    UI.updateStatus("idle", "Fertig");
  } catch (e) {
    UI.updateStatus("error", "Fehler: " + e.message);
  } finally {
    UI.elements.loadingOverlay.classList.add("hidden");
  }
}

// =========================================================
// 4. Execution & Listeners
// =========================================================

/**
 * Orchestrates the application startup sequence
 */
async function startApp() {
  await loadExercises();
  UI.init(getProfilePool("default"));
  setupEventListeners();
  await initializeCurrentMode();
}

/**
 * Registers all core interaction listeners
 */
function setupEventListeners() {
  UI.elements.scenarioSelect.addEventListener("change", (e) =>
    loadContent(e.target.value),
  );

  UI.elements.sendBtn.addEventListener("click", handleSend);
  UI.elements.userInput.addEventListener(
    "keypress",
    (e) => e.key === "Enter" && handleSend(),
  );

  UI.elements.feedbackBtn.addEventListener("click", handleFeedback);
  UI.elements.exportTranscriptBtn?.addEventListener(
    "click",
    downloadCurrentTranscript,
  );
  UI.elements.modalDownloadBtn?.addEventListener(
    "click",
    downloadCurrentTranscript,
  );

  // Sidebar Reset Button logic
  UI.elements.resetBtn?.addEventListener("click", () => {
    UI.openResetModal();
  });

  UI.elements.briefingHeader.addEventListener("click", () => {
    const h = UI.elements.briefingContent.classList.toggle("hidden");
    UI.elements.chevron.style.transform = h ? "rotate(90deg)" : "rotate(0deg)";
  });

  UI.elements.mobileMenuBtn?.addEventListener("click", () =>
    UI.toggleMobileMenu(),
  );
  UI.elements.sidebarOverlay?.addEventListener("click", () =>
    UI.toggleMobileMenu(true),
  );

  UI.elements.userInput.addEventListener(
    "focus",
    () =>
      window.innerWidth < 1024 &&
      UI.elements.briefingContent.classList.add("hidden"),
  );

  // Setup TTS toggle mit korrekter ID und Initialisierung
  const ttsToggle = document.getElementById("auto-speak-toggle");
  if (ttsToggle) {
    STATE.ttsEnabled = ttsToggle.checked;
    ttsToggle.addEventListener("change", (e) => {
      STATE.ttsEnabled = e.target.checked;

      if (STATE.ttsEnabled) {
        // Sofortiges Feedback: Wenn ein Briefing offen ist, lies es vor
        const briefing = UI.elements.briefingContent.innerText; // Use innerText for content
        if (
          briefing &&
          !UI.elements.briefingContent.classList.contains("hidden")
        ) {
          UI.speak(briefing, "Briefing");
        }
      } else {
        window.speechSynthesis.cancel();
      }
    });
  }
}

/**
 * Determines and activates the initial mode based on UI state
 */
async function initializeCurrentMode() {
  STATE.currentMode = "roleplay";

  await initScenarioDropdown();
  await switchToRoleplayMode();
}

document.addEventListener("DOMContentLoaded", () => {
  window.updateSubtitleText();
  startApp();
});
window.addEventListener("resize", window.updateSubtitleText);
