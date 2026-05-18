import { API } from "./api.js";
import { APP_CONFIG } from "./config.js";
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
    shortInstruction: "",
  },
  chatHistory: [],
  answers: [],
  currentMode: "roleplay",
  exerciseIndex: 0,
  exerciseAwaitingRevision: false,
  ichBotschaftStatements: [],
  ichBotschaftFeedbackPrompt: "",
  transformationStatements: [],
  transformationFeedbackPrompt: "",
  allExercises: [],
  allScenarios: [],
  ttsEnabled: false,
};

/**
 * Resets UI and state for a mode change
 */
function resetAppForMode(mode) {
  STATE.currentMode = mode;
  STATE.chatHistory = [];
  STATE.exerciseIndex = 0;
  STATE.exerciseAwaitingRevision = false;
  STATE.answers = [];
  UI.elements.chatWindow.innerHTML = "";
  UI.elements.chatWindow.closest("main")?.scrollTo(0, 0);
  UI.elements.briefingContent.classList.remove("hidden");
  UI.setBriefingExpanded(true);
  UI.updateSidebarVisibility(mode);
  UI.setModeBadge(mode);

  // Centralized button reset
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

function getTransformationProgressText() {
  return STATE.transformationStatements.length
    ? `Aussage ${STATE.exerciseIndex + 1} von ${STATE.transformationStatements.length}`
    : "Bereit";
}

function restartTransformationExercise() {
  if (STATE.currentMode !== "transformation") return;

  STATE.exerciseIndex = 0;
  STATE.transformationStatements = Utils.shuffleArray(
    STATE.transformationStatements,
  );
  STATE.exerciseAwaitingRevision = false;
  STATE.chatHistory = [];
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

  const statement = STATE.transformationStatements[STATE.exerciseIndex];
  const taskText = `"${statement}"\n\n${STATE.config.shortInstruction}`;
  STATE.chatHistory.push({ role: "assistant", content: taskText });
  UI.appendMessage(taskText, "partner", {
    roleName: STATE.config.roleName,
    messageType: "task",
    isIchMode: true,
    shouldScroll: false,
  });
  if (STATE.ttsEnabled) UI.speak(taskText, STATE.config.roleName);
  UI.updateInputUI(false, "Eingabe...");
  UI.updateStatus("idle", `${getTransformationProgressText()} (restarted)`);
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

async function switchToTransformationMode(
  exerciseId = "ich_botschaften_basis",
) {
  resetAppForMode("transformation");
  UI.elements.briefingContent.textContent = "Übung wird geladen...";
  UI.updateInputUI(true, "Wähle eine Übung...");

  await initExerciseDropdown();

  const transformationExercises = STATE.allExercises.filter(
    (ex) => ex.type === "TRANSFORMATION",
  );
  if (transformationExercises.length > 0) {
    // If no exercise is currently selected, or selected one is not a transformation, select the first transformation
    if (
      !UI.elements.exerciseSelect?.value ||
      !transformationExercises.some(
        (ex) => ex.id === UI.elements.exerciseSelect?.value,
      )
    ) {
      UI.elements.exerciseSelect.value = exerciseId;
    }

    // Exercise Dropdown Event Listener wird die Übung laden
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

async function initExerciseDropdown() {
  await initDropdown(
    "TRANSFORMATION",
    UI.elements.exerciseSelect,
    "Wähle eine Übung...",
  );
}

/**
 * Unified loader for both Roleplay and Transformation content
 */
async function loadContent(exerciseId) {
  const exercise = STATE.allExercises.find((ex) => ex.id === exerciseId);
  if (!exercise) return;
  const isTransform = exercise.type === "TRANSFORMATION";
  const exConfig = exercise.config;

  UI.updateStatus("loading", "Lade...");
  UI.setBriefingLoading(true);
  UI.elements.chatWindow.innerHTML = "";
  STATE.chatHistory = [];

  try {
    const fileToLoad = isTransform
      ? exConfig.instructionFile
      : exConfig.scenarioFile;
    const data = await API.fetchCompleteScenario(fileToLoad);

    // Common metadata
    STATE.config.roleName = isTransform
      ? data.roleLabel || "Trainer"
      : Utils.extractRoleName(data.instructionSection, data.roleLabel);
    STATE.config.systemPrompt = data.prompts.system;
    STATE.config.partnerPrompt = data.prompts.partner;
    STATE.config.mentorPrompt = data.prompts.mentor;
    STATE.transformationFeedbackPrompt = data.prompts.trainer;
    STATE.config.shortInstruction =
      data.shortInstruction || "Bearbeite die Aussage.";

    if (isTransform) {
      // Load transformation statements specifically
      const resp = await fetch(`${exConfig.sourceFile}?t=${Date.now()}`);
      const text = await resp.text();
      STATE.transformationStatements = Utils.shuffleArray(
        text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#")),
      );

      document.getElementById("main-subtitle").textContent =
        `${data.title}: ${STATE.config.shortInstruction}`;

      // Auto-post first statement
      const first = STATE.transformationStatements[0];
      const taskText = `"${first}"\n\n${STATE.config.shortInstruction}`;
      STATE.chatHistory.push({ role: "assistant", content: taskText });
      UI.appendMessage(taskText, "partner", {
        roleName: STATE.config.roleName,
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
      data.instructionSection,
    );

    if (STATE.ttsEnabled) UI.speak(data.instructionSection, "Briefing");
    UI.elements.chevron.style.transform = "rotate(0deg)";
    UI.updateInputUI(
      false,
      isTransform ? "Eingabe..." : `Nachricht an ${STATE.config.roleName}...`,
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
    scenarioTitle = activeSelect.options[activeSelect.selectedIndex].text;
    scenarioTitle = scenarioTitle.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").trim(); // Sonderzeichen entfernen, Umlaute und Bindestriche behalten
    scenarioTitle = scenarioTitle.replace(/\s+/g, "_"); // Leerzeichen durch Unterstriche ersetzen
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

  const isRoleplay = STATE.currentMode === "roleplay";

  UI.prepareForInteraction();
  UI.appendMessage(userVal, "user", { isIchMode: !isRoleplay });
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

  if (isRoleplay) {
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
  } else {
    // Transformation Mode: Sequential collection
    STATE.answers.push({
      statement: STATE.transformationStatements[STATE.exerciseIndex],
      answer: userVal,
    });

    if (STATE.exerciseIndex < STATE.transformationStatements.length - 1) {
      STATE.exerciseIndex++;
      const nextStatement = STATE.transformationStatements[STATE.exerciseIndex];
      const taskText = `"${nextStatement}"\n\n${STATE.config.shortInstruction}`;

      setTimeout(() => {
        UI.appendMessage(taskText, "partner", {
          roleName: STATE.config.roleName,
          isIchMode: true,
          messageType: "task",
        });
        if (STATE.ttsEnabled) UI.speak(taskText, STATE.config.roleName);
        UI.updateStatus("idle", getTransformationProgressText());
        UI.updateInputUI(false, "Eingabe...");
        UI.elements.userInput.focus();
      }, 400);
    } else {
      finalizeExercise();
    }
  }
}

/**
 * Ends the exercise and requests the AI overall evaluation.
 * Can be triggered automatically at the end or manually by the user.
 */
async function finalizeExercise() {
  // Prevent multiple triggers or triggers without answers
  if (STATE.answers.length === 0) return;

  UI.updateInputUI(true, "Wird ausgewertet...");
  UI.updateStatus("loading", "Trainer erstellt Gesamtauswertung...");
  UI.showTypingIndicator(STATE.config.roleName);

  try {
    const combinedResults = STATE.answers
      .map(
        (item, idx) =>
          `Übung ${idx + 1}:\nAusgangslage: "${item.statement}"\nDeine Antwort: "${item.answer}"`,
      )
      .join("\n\n---\n\n");

    const messages = [
      {
        role: "system",
        content:
          STATE.transformationFeedbackPrompt +
          "\n\nDer Nutzer hat die Übungsreihe abgeschlossen. Bitte gib zu jeder Antwort ein kurzes Feedback und schließe mit einem motivierenden Fazit ab.",
      },
      { role: "user", content: combinedResults },
    ];

    const data = await API.callChatApi(messages, {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: APP_CONFIG.CHAT_TEMPERATURE,
    });

    if (!data) return;
    UI.hideTypingIndicator();

    const feedback = data.choices[0].message.content;
    UI.appendMessage(feedback, "partner", {
      roleName: STATE.config.roleName,
      isIchMode: true,
      messageType: "feedback",
    });
    STATE.chatHistory.push({ role: "assistant", content: feedback });

    // Swap buttons: Hide feedback, show export
    UI.elements.feedbackBtn.classList.add("hidden");
    if (UI.elements.exportTranscriptBtn) {
      UI.elements.exportTranscriptBtn.classList.remove("hidden");
    }
    UI.updateStatus("idle", "Übung beendet");
  } catch (e) {
    UI.hideTypingIndicator();
    UI.updateStatus("error", "Fehler bei der Auswertung");
    UI.updateInputUI(false, "Eingabe...");
  }
}

async function handleFeedback() {
  if (STATE.chatHistory.length === 0) return;

  if (STATE.currentMode === "transformation") {
    await finalizeExercise();
    return;
  } else if (STATE.currentMode === "roleplay") {
    // In roleplay mode, the feedback button triggers mentor analysis
    // The logic for this is already present below
    // No 'return' here, let it fall through to the mentor analysis
  }

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
  UI.init();
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
  UI.elements.exerciseSelect?.addEventListener("change", (e) =>
    loadContent(e.target.value),
  );

  UI.elements.sendBtn.addEventListener("click", handleSend);
  UI.elements.userInput.addEventListener(
    "keypress",
    (e) => e.key === "Enter" && handleSend(),
  );

  UI.elements.modeSelect?.addEventListener("change", async (e) => {
    const selectedMode = e.target.value;
    STATE.currentMode = selectedMode;

    if (selectedMode === "transformation") {
      await initExerciseDropdown();
      const firstEx = STATE.allExercises.find(
        (ex) => ex.type === "TRANSFORMATION",
      );
      if (firstEx) await switchToTransformationMode(firstEx.id);
    } else {
      await switchToRoleplayMode();
    }
  });

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

  UI.elements.nextExerciseBtn?.addEventListener("click", () => {
    if (STATE.currentMode === "transformation") {
      if (STATE.exerciseIndex >= STATE.transformationStatements.length - 1) {
        UI.appendMessage("Alle erledigt!", "partner", { isIchMode: true });
        return;
      }
      STATE.exerciseIndex++;
      STATE.exerciseAwaitingRevision = false;
      UI.setExerciseActionsVisible(false);
      const statement = STATE.transformationStatements[STATE.exerciseIndex];
      const taskText = `"${statement}"\n\n${STATE.config.shortInstruction}`;
      UI.appendMessage(taskText, "partner", {
        roleName: STATE.config.roleName,
        messageType: "task",
        isIchMode: true,
      });
      if (STATE.ttsEnabled) UI.speak(taskText, STATE.config.roleName);
      UI.updateStatus("idle", getTransformationProgressText());
      UI.updateInputUI(false, "Eingabe...");
      UI.elements.userInput.focus();
    }
  });

  UI.elements.reviseBtn?.addEventListener("click", () => {
    UI.setExerciseActionsVisible(false);
    STATE.exerciseAwaitingRevision = false;
    UI.updateInputUI(false, "Eingabe korrigieren...");
    UI.elements.userInput.focus();
  });

  UI.elements.restartExerciseBtn?.addEventListener("click", () => {
    if (STATE.currentMode === "transformation") {
      restartTransformationExercise();
    }
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
  STATE.currentMode = UI.elements.modeSelect?.value || "roleplay";

  await initScenarioDropdown();
  if (STATE.currentMode === "transformation") {
    const firstEx = STATE.allExercises.find(
      (ex) => ex.type === "TRANSFORMATION",
    );
    if (firstEx) {
      await switchToTransformationMode(firstEx.id);
    }
    return;
  }
  await switchToRoleplayMode();
}

document.addEventListener("DOMContentLoaded", () => {
  window.updateSubtitleText();
  startApp();
});
window.addEventListener("resize", window.updateSubtitleText);
