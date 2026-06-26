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
 * Holds runtime data that changes during a session.
 * @type {Object}
 * @property {Object[]} answers - Collected user answers for batch evaluation in transformation mode.
 * @property {string} currentMode - The active operation mode ('roleplay' or 'transformation').
 * @property {number} exerciseIndex - The current progression index within an exercise.
 * @property {string[]} activeStatements - The pool of statements for the current transformation exercise.
 * @property {boolean} ttsEnabled - Flag for global text-to-speech auto-play.
 */
const STATE = {
  answers: [],
  currentMode: "roleplay",
  exerciseIndex: 0,
  activeStatements: [],
  ttsEnabled: false,
};

/**
 * Resets the application state and UI when switching between different modes or scenarios.
 * Prepares the sidebar buttons, clears chat history, and resets local indices.
 *
 * @param {string} mode - The mode to initialize ('roleplay' or 'transformation').
 * @returns {void}
 */
function resetAppForMode(mode) {
  STATE.currentMode = mode;
  if (UI.elements.modeSelect) UI.elements.modeSelect.value = mode;
  Chat.clear();
  STATE.exerciseIndex = 0;
  STATE.answers = [];

  UI.elements.chatWindow.innerHTML = "";
  UI.elements.chatWindow.closest("main")?.scrollTo(0, 0);
  UI.elements.briefingContent.classList.remove("hidden");
  UI.setBriefingExpanded(true);
  UI.updateSidebarVisibility(mode);
  UI.setModeBadge(mode);

  const isTransform = mode === "transformation";
  if (UI.elements.feedbackBtn) {
    UI.elements.feedbackBtn.classList.remove("hidden");
    UI.elements.feedbackBtn.disabled = true;
    UI.elements.feedbackBtn.classList.add("opacity-50", "cursor-not-allowed");
    UI.elements.feedbackBtn.innerHTML = isTransform
      ? "<span>📊</span> Auswertung erstellen"
      : "<span>📊</span> Feedback erhalten";
  }

  if (UI.elements.exportTranscriptBtn)
    UI.elements.exportTranscriptBtn.classList.add("hidden");
  if (UI.elements.resetBtn) {
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

/**
 * Fetches the initial exercise catalog from the server using the ScenarioService.
 * Populates the internal exercise pool or displays an error in the UI on failure.
 *
 * @async
 */
async function loadExercises() {
  try {
    await ScenarioService.loadPool();
  } catch (error) {
    UI.updateStatus("error", `Fehler: ${error.message}`);
    UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">Fehler: ${error.message}</p>`;
  }
}

/**
 * Generates a human-readable progress indicator for transformation mode.
 * Displays the current step relative to the total number of statements.
 *
 * @private
 * @returns {string}
 */
function getTransformationProgressText() {
  return STATE.activeStatements.length
    ? `Aussage ${STATE.exerciseIndex + 1} von ${STATE.activeStatements.length}`
    : "Bereit";
}

/**
 * Resets the current transformation session.
 * Re-shuffles statements, clears the local history, and restarts the progression
 * from the first task.
 * @returns {void}
 */
function restartTransformationExercise() {
  if (STATE.currentMode !== "transformation") return;

  STATE.exerciseIndex = 0;
  STATE.activeStatements = ScenarioService.getStatements(true);

  Chat.clear();
  STATE.answers = [];
  UI.elements.chatWindow.innerHTML = "";
  UI.setExerciseActionsVisible(false);

  // Reset sidebar buttons
  UI.elements.feedbackBtn.classList.remove("hidden");
  UI.elements.feedbackBtn.disabled = true;
  UI.elements.feedbackBtn.classList.add("opacity-50", "cursor-not-allowed");
  UI.elements.feedbackBtn.innerHTML = "<span>📊</span> Auswertung erstellen";

  if (UI.elements.exportTranscriptBtn) {
    UI.elements.exportTranscriptBtn.classList.add("hidden");
  }
  if (UI.elements.resetBtn) {
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const config = ScenarioService.getActive();
  const statement = STATE.activeStatements[STATE.exerciseIndex];
  const taskText = `"${statement}"\n\n${config.shortInstruction}`;

  Chat.add("assistant", taskText);
  UI.appendMessage(taskText, "partner", {
    roleName: config.roleName,
    messageType: "task",
    isIchMode: true,
    shouldScroll: false,
  });
  if (STATE.ttsEnabled) UI.speak(taskText, config.roleName);
  UI.updateInputUI(false, "Eingabe...");
  UI.updateStatus("idle", `${getTransformationProgressText()} (restarted)`);
}

/**
 * Configures the application for Roleplay mode.
 * Populates scenario dropdowns and activates the default or previously selected simulation.
 *
 * @async
 */
async function switchToRoleplayMode() {
  resetAppForMode("roleplay");
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
 * Configures the application for Transformation mode.
 * Populates exercise dropdowns and loads the specified or default exercise.
 *
 * @async
 * @param {string} [exerciseId="ich_botschaften_basis"] - The ID of the exercise to activate.
 */
async function switchToTransformationMode(
  exerciseId = "ich_botschaften_basis",
) {
  resetAppForMode("transformation");
  UI.updateInputUI(true, "Wähle eine Übung...");

  await initExerciseDropdown();

  const transformationExercises =
    ScenarioService.getExercisesByType("TRANSFORMATION");
  if (transformationExercises.length > 0) {
    const targetId = exerciseId || transformationExercises[0].id;
    // Ensure the dropdown shows the correct selection
    UI.elements.exerciseSelect.value = targetId;
    UI.elements.exerciseSelect.dispatchEvent(new Event("change"));
  } else {
    UI.updateStatus("idle", "Keine Transformations-Übungen verfügbar.");
    UI.updateInputUI(true, "Keine Übungen verfügbar.");
  }

  UI.updateStatus("idle", "Transformationen aktiv");
}

// =========================================================
// 2. Scenario & Dropdown Logic
// =========================================================

/**
 * Generic helper to populate a <select> element with options from the exercise pool.
 * Fetches scenario titles asynchronously to display user-friendly names.
 *
 * @async
 * @param {string} type - The exercise type to filter by ('SIMULATION' or 'TRANSFORMATION').
 * @param {HTMLSelectElement} selectElement - The target dropdown element.
 * @param {string} placeholder - The default disabled option text.
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
 * Initializes the simulation scenario dropdown.
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
 * Initializes the transformation exercise dropdown.
 * @async
 */
async function initExerciseDropdown() {
  await initDropdown(
    "TRANSFORMATION",
    UI.elements.exerciseSelect,
    "Wähle eine Übung...",
  );
}

/**
 * Main entry point for loading specific content (scenarios or exercises).
 * Fetches data via ScenarioService and updates UI components, avatars, and briefing.
 *
 * @async
 * @param {string} exerciseId - The ID of the content to load.
 */
async function loadContent(exerciseId) {
  UI.updateStatus("loading", "Lade...");
  UI.setBriefingLoading(true);
  UI.elements.chatWindow.innerHTML = "";
  Chat.clear();

  try {
    const config = await ScenarioService.loadScenario(exerciseId);
    const isTransform = config.type === "TRANSFORMATION";

    // Update Avatar Display Name
    if (UI.elements.partnerNameDisplay) {
      UI.elements.partnerNameDisplay.textContent = config.roleName;
    }

    // Passendes Character-Profil finden und initialisieren
    const profileKey = config.roleLabel || config.roleName;
    const profilePool = getProfilePool(profileKey);
    await UI.initAvatar(profilePool);

    if (isTransform) {
      STATE.activeStatements = ScenarioService.getStatements(true);
      STATE.exerciseIndex = 0;

      document.getElementById("main-subtitle").textContent =
        `${config.title}: ${config.shortInstruction}`;

      // Auto-post first statement
      const first = STATE.activeStatements[0];
      const taskText = `"${first}"\n\n${config.shortInstruction}`;
      Chat.add("assistant", taskText);
      UI.appendMessage(taskText, "partner", {
        roleName: config.roleName,
        messageType: "task",
        isIchMode: true,
        shouldScroll: false,
      });
    } else {
      // Roleplay specific UI updates
      UI.elements.startInfo.classList.remove("hidden");
      UI.elements.chatWindow.appendChild(UI.elements.startInfo);
    }

    Utils.renderBoldMarkdownWithLineBreaks(
      UI.elements.briefingContent,
      config.instructionSection,
    );

    if (STATE.ttsEnabled) UI.speak(config.instructionSection, "Briefing");
    UI.elements.chevron.style.transform = "rotate(0deg)";
    UI.updateInputUI(
      false,
      isTransform ? "Eingabe..." : `Nachricht an ${config.roleName}...`,
    );
    UI.updateStatus(
      "idle",
      isTransform ? getTransformationProgressText() : "Bereit",
    );
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

  const config = ScenarioService.getActive();
  if (!config) return;

  UI.prepareForInteraction();
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

  if (STATE.currentMode === "transformation") {
    // 1. Save response
    STATE.answers.push({
      statement: STATE.activeStatements[STATE.exerciseIndex],
      userResponse: userVal,
    });

    // 2. Increment index
    STATE.exerciseIndex++;

    // 3. Check if more statements are available
    if (STATE.exerciseIndex < STATE.activeStatements.length) {
      const nextStatement = STATE.activeStatements[STATE.exerciseIndex];
      const taskText = `"${nextStatement}"\n\n${config.shortInstruction}`;

      // Display next task in chat
      Chat.add("assistant", taskText);
      UI.appendMessage(taskText, "partner", {
        roleName: config.roleName,
        messageType: "task",
        isIchMode: true,
      });

      if (STATE.ttsEnabled) UI.speak(taskText, config.roleName);
      UI.updateStatus("idle", getTransformationProgressText());
      UI.updateInputUI(false, "Deine Umformulierung...");
    } else {
      // End of exercise series
      const endMsg =
        "Alle Aussagen bearbeitet. Klicke jetzt auf 'Auswertung erstellen', um dein Feedback zu erhalten.";
      UI.appendMessage(endMsg, "partner", {
        roleName: config.roleName,
        messageType: "task",
        isIchMode: true,
      });
      UI.updateStatus("idle", "Übung abgeschlossen");
      UI.updateInputUI(true, "Alle Aufgaben erledigt.");
      UI.setExerciseActionsVisible(false);
    }
  } else {
    // Roleplay Mode: Real-time conversation
    UI.updateInputUI(true, "Sende...");
    UI.updateStatus("loading", "Antwortet...");
    UI.showTypingIndicator(config.roleName);

    if (!Chat.hasSystemPrompt()) {
      Chat.setSystemPrompt(
        `${config.prompts.system}\n\n${config.prompts.partner}`,
      );
    }

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
  UI.elements.modeSelect?.addEventListener("change", (e) => {
    if (e.target.value === "transformation") {
      switchToTransformationMode();
    } else {
      switchToRoleplayMode();
    }
  });

  UI.elements.scenarioSelect.addEventListener("change", (e) =>
    loadContent(e.target.value),
  );
  UI.elements.exerciseSelect?.addEventListener("change", (e) =>
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
    UI.elements.chevron.style.transform = h ? "rotate(270deg)" : "rotate(0deg)";
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
  const ttsToggle = UI.elements.autoSpeakToggle;
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
 * @async
 */
async function initializeCurrentMode() {
  if (STATE.currentMode === "transformation") {
    await switchToTransformationMode();
  } else {
    await switchToRoleplayMode();
  }
}

// Initialization on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  startApp();
});
