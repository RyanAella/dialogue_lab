import { API } from "./api.js";
import { Chat } from "./chat.js";
import { APP_CONFIG } from "./config.js";
import { getProfilePool } from "./profiles.js";
import { ScenarioService } from "./scenario.js";
import { UI } from "./ui.js";
import { Utils } from "./utils.js";

/**
 * @module App
 * Main controller for the Dialogue Lab application.
 * Orchestrates state management, scenario loading, and user interactions.
 */

/**
 * Global application state.
 * @type {Object}
 */
const STATE = {
  currentMode: "roleplay",
  ttsEnabled: false,
};

/**
 * Resets the UI and internal state when switching modes or scenarios.
 * @param {string} mode - The mode to reset for (defaults to 'roleplay').
 * @returns {void}
 */
function resetAppForMode(mode) {
  STATE.currentMode = mode;
  Chat.clear();
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

/**
 * Loads the initial exercise pool from the server via ScenarioService.
 * Handles errors by updating the UI status.
 * @async
 */
async function loadExercises() {
  try {
    await ScenarioService.loadPool();
  } catch (error) {
    console.error("Fehler beim Laden der Übungen:", error);
    UI.updateStatus("error", `Fehler: ${error.message}`);
    UI.updateInputUI(true, "Fehler beim Laden.");
  }
}

/**
 * Orchestrates the transition into the Roleplay (Simulation) mode.
 * Initializes dropdowns and selects the first available simulation.
 * @async
 */
async function switchToRoleplayMode() {
  resetAppForMode("roleplay");
  UI.elements.briefingContent.textContent = "Szenario wird geladen...";
  UI.updateInputUI(true, "Wähle ein Szenario...");

  await initScenarioDropdown();

  const simulationExercises = ScenarioService.getExercisesByType("SIMULATION");
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

/**
 * Generic helper to populate a select element with exercises of a specific type.
 * Fetches scenario titles asynchronously to display user-friendly names.
 *
 * @param {string} type - The exercise type (e.g., 'SIMULATION').
 * @param {HTMLSelectElement} selectElement - The target dropdown.
 * @param {string} placeholder - The default disabled option text.
 * @async
 */
async function initDropdown(type, selectElement, placeholder) {
  if (!selectElement) return;

  selectElement.innerHTML = `<option value="" selected disabled>${placeholder}</option>`;
  const filtered = ScenarioService.getExercisesByType(type);

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

/**
 * Initializes the scenario selection dropdown for simulations.
 * @async
 */
async function initScenarioDropdown() {
  await initDropdown(
    "SIMULATION",
    UI.elements.scenarioSelect,
    "Wähle ein Szenario...",
  );
}

/**
 * Loads and initializes a specific scenario by its ID.
 * Handles API calls, UI updates, and avatar setup.
 *
 * @param {string} exerciseId - The unique ID of the exercise to load.
 * @async
 */
async function loadContent(exerciseId) {
  UI.updateStatus("loading", "Lade...");
  UI.setBriefingLoading(true);
  UI.elements.chatWindow.innerHTML = "";
  Chat.clear();

  try {
    const config = await ScenarioService.loadScenario(exerciseId);

    // Update Avatar Display Name
    if (UI.elements.partnerNameDisplay) {
      UI.elements.partnerNameDisplay.textContent = config.roleName;
    }

    // Setze System-Prompt SOFORT mit initialTopicGuidance als oberste Priorität
    const roleAdherence = "Verhalte dich konsequent gemäß deiner Rollenbeschreibung. Überlasse die Gesprächsführung und die Initiative dem Benutzer.";
    const initialTopicGuidance = "KRITISCHE REGEL: Antworte NUR auf das, was der Nutzer explizit anspricht. Bei Begrüßungen (z. B. 'Hallo', 'Wie geht's?', 'Du schon wieder') antworte kurz und neutral (z. B. 'Hallo!', 'Gut, danke.'). Beginne NIE von selbst Gespräche über Reporting, Blockaden oder andere Themen. Warte IMMER, bis der Nutzer das Thema explizit einführt.";
    Chat.setSystemPrompt(`### ABSOLUTE PRIORITÄT ###\n${initialTopicGuidance}\n\n${roleAdherence}\n\n${config.prompts.system}\n\n${config.prompts.partner}`);

    // Find and initialize matching character profile
    const profileKey = config.roleLabel || config.roleName;
    const profilePool = getProfilePool(profileKey);
    await UI.initAvatar(profilePool);

    // Roleplay specific UI updates
    UI.elements.startInfo.classList.remove("hidden");
    UI.elements.chatWindow.appendChild(UI.elements.startInfo);

    Utils.renderBoldMarkdownWithLineBreaks(
      UI.elements.briefingContent,
      config.instructionSection,
    );

    if (STATE.ttsEnabled) UI.speak(config.instructionSection, "Briefing");
    UI.elements.chevron.style.transform = "rotate(0deg)";
    UI.updateInputUI(false, `Nachricht an ${config.roleName}...`);
    UI.updateStatus("idle", "Bereit");
  } catch (error) {
    console.error("Content loading failed:", error);
    UI.elements.briefingContent.innerHTML =
      '<p class="text-red-500 p-4">Ladefehler.</p>';
    UI.updateStatus("error", "Ladefehler");
  }
}

/**
 * Formats the filename based on the current mode, scenario title, and date.
 */
function downloadCurrentTranscript() {
  const config = ScenarioService.getActive();
  if (!config) return;

  const briefing = UI.elements.briefingContent?.innerText.trim() || "";
  const header = `### BRIEFING ###\n\n${briefing}\n\n${"=".repeat(50)}\n\n### PROTOKOLL ###\n\n`;
  const chatContent = Chat.getTranscript(config.roleName);

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

  const filename = filenameParts.join("_") + ".txt";
  Utils.downloadFile(header + chatContent, filename);
}

/**
 * Updates the UI, adds to history, and triggers the AI partner response.
 *
 * @async
 */
async function handleSend() {
  const userVal = UI.elements.userInput.value.trim();
  if (!userVal) return;

  UI.prepareForInteraction();
  UI.appendMessage(userVal, "user", { isIchMode: false });
  if (STATE.ttsEnabled) UI.speak(userVal, "Ich");
  Chat.add("user", userVal);
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
  const config = ScenarioService.getActive();
  if (!config) return;
  UI.updateInputUI(true, "Sende...");
  UI.updateStatus("loading", "Antwortet...");
  UI.showTypingIndicator(config.roleName);

  try {
    const data = await API.callChatApi(Chat.getHistory(), {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: APP_CONFIG.CHAT_TEMPERATURE,
    });
    if (!data) return;
    UI.hideTypingIndicator();
    const botResp = data.choices[0].message.content;
    UI.appendMessage(botResp, "partner", { roleName: config.roleName });
    Chat.add("assistant", botResp);
    if (STATE.ttsEnabled) UI.speak(botResp, config.roleName);
    UI.updateStatus("idle", "Bereit");
  } catch (e) {
    UI.hideTypingIndicator();
    UI.updateStatus("error", e.message);
  } finally {
    UI.updateInputUI(false, `Nachricht an ${config.roleName}...`);
    UI.elements.userInput.focus();
  }
}

/**
 * Handles the request for AI mentor feedback.
 * Submits the transcript to the API and displays the result in a modal.
 * @async
 */
async function handleFeedback() {
  if (Chat.getMessageCount() === 0) return;

  const config = ScenarioService.getActive();
  UI.elements.loadingOverlay?.classList.remove("hidden");
  UI.updateStatus("loading", "Mentor analysiert...");
  const transcript = Chat.getTranscript(config.roleName);

  try {
    const data = await API.callChatApi(
      [
        { role: "system", content: config.prompts.mentor },
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

/**
 * Orchestrates the application startup sequence.
 * 1. Loads exercises.
 * 2. Initializes UI.
 * 3. Binds events.
 * 4. Sets initial mode.
 */
async function startApp() {
  await loadExercises();
  await UI.init();
  setupEventListeners();
  await initializeCurrentMode();
}

/**
 * Registers event listeners for core UI interactions such as sending messages,
 * changing scenarios, and toggling application settings.
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

  UI.elements.feedbackBtn?.addEventListener("click", handleFeedback);
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
    UI.elements.chevron.style.transform = h ? "rotate(-90deg)" : "rotate(0deg)";
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

  // Setup TTS toggle logic
  const ttsToggle = document.getElementById("auto-speak-toggle");
  if (ttsToggle) {
    STATE.ttsEnabled = ttsToggle.checked;
    ttsToggle.addEventListener("change", (e) => {
      STATE.ttsEnabled = e.target.checked;

      if (STATE.ttsEnabled) {
        // Immediate feedback: Speak briefing if visible
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
 * Determines and activates the initial mode based on UI state.
 * @async
 */
async function initializeCurrentMode() {
  STATE.currentMode = "roleplay";

  await initScenarioDropdown();
  await switchToRoleplayMode();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await startApp();
  } catch (error) {
    console.error("Critical initialization error:", error);
    UI.updateStatus("error", "Die Anwendung konnte nicht korrekt initialisiert werden.");
  }
});

/**
 * Closes the feedback modal and triggers a reset of the current content,
 * without reloading the entire page.
 */
async function closeFeedbackModal() {
  const modal = UI.elements.feedbackModal;
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "auto";

  await confirmReset();
}

/**
 * Performs the actual reset based on the current mode.
 */
async function confirmReset() {
  // Fallback to direct DOM access if UI.elements binding is missing
  const modal = UI.elements.resetModal || document.getElementById("reset-modal");
  if (modal) modal.classList.add("hidden");

  await switchToRoleplayMode();
}

// Make functions globally available for onclick attributes in index.html
window.closeFeedbackModal = closeFeedbackModal;
window.confirmReset = confirmReset;
