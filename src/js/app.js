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
 * Setzt die UI und den State für einen Moduswechsel zurück
 */
function resetAppForMode(mode) {
  STATE.currentMode = mode;
  STATE.chatHistory = [];
  STATE.exerciseIndex = 0;
  STATE.exerciseAwaitingRevision = false;

  UI.elements.chatWindow.innerHTML = "";
  UI.elements.chatWindow.closest("main")?.scrollTo(0, 0);
  UI.elements.briefingContent.classList.remove("hidden");
  UI.setExerciseActionsVisible(false);
  UI.updateSidebarVisibility(mode);
  UI.setModeBadge(mode);
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
  UI.elements.chatWindow.innerHTML = "";
  UI.setExerciseActionsVisible(false);

  UI.elements.feedbackBtn.disabled = true;
  UI.elements.feedbackBtn.classList.add("opacity-50", "cursor-not-allowed");

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
  UI.updateStatus("idle", `${getTransformationProgressText()} (neu gestartet)`);
}

/**
 * Generic helper to reset buttons when switching modes
 */
function updateModeButtons(isTransformation) {
  const { feedbackBtn, resetBtn } = UI.elements;

  feedbackBtn.textContent = isTransformation
    ? "📥 Protokoll herunterladen"
    : "📊 Feedback erhalten";
  feedbackBtn.className = isTransformation
    ? "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
    : "flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2";

  feedbackBtn.disabled = true;
  feedbackBtn.classList.add("opacity-50", "cursor-not-allowed");

  resetBtn.disabled = !isTransformation;
  resetBtn.classList.toggle("opacity-50", !isTransformation);
  resetBtn.classList.toggle("cursor-not-allowed", !isTransformation);
}

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
    UI.updateInputUI(true, "Keine Szenarien verfügbar.");
  }

  updateModeButtons(false);

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

  updateModeButtons(true);

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
  if (
    UI.elements.scenarioSelect &&
    UI.elements.scenarioSelect.selectedIndex > 0
  ) {
    scenarioTitle =
      UI.elements.scenarioSelect.options[
        UI.elements.scenarioSelect.selectedIndex
      ].text;
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

/**
 * Returns the correct message payload and temperature for the current mode
 */
function getApiPayload(userMessage, isRoleplay) {
  if (isRoleplay) {
    if (STATE.chatHistory.length === 0) {
      STATE.chatHistory.push({
        role: "system",
        content: `${STATE.config.systemPrompt}\n\n${STATE.config.partnerPrompt}`,
      });
    }
    return {
      messages: STATE.chatHistory,
      temperature: APP_CONFIG.CHAT_TEMPERATURE,
    };
  }

  return {
    messages: [
      { role: "system", content: STATE.transformationFeedbackPrompt },
      {
        role: "user",
        content: `Statement: ${STATE.transformationStatements[STATE.exerciseIndex]}\nUser: ${userMessage}`,
      },
    ],
    temperature: APP_CONFIG.ICH_BOTSCHAFT_TEMPERATURE,
  };
}

async function handleSend() {
  const message = UI.elements.userInput.value.trim();
  if (!message) return;

  const isRoleplay = STATE.currentMode === "roleplay";
  if (isRoleplay && !STATE.config.systemPrompt) return;

  UI.prepareForInteraction();

  // Show user message and set UI to loading
  UI.updateInputUI(true, isRoleplay ? "Sende..." : "Feedback...");
  UI.appendMessage(message, "user", { isIchMode: !isRoleplay });
  if (STATE.ttsEnabled) UI.speak(message, "Ich");

  UI.updateStatus("loading", isRoleplay ? "Antwortet..." : "Trainer...");
  UI.showTypingIndicator(isRoleplay ? STATE.config.roleName : "Trainer");
  UI.elements.userInput.value = "";

  const { messages, temperature } = getApiPayload(message, isRoleplay);

  try {
    // Unified history tracking for both modes
    STATE.chatHistory.push({ role: "user", content: message });

    const data = await API.callChatApi(messages, {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: temperature,
    });

    // If request was aborted, stop processing
    if (!data) return;

    UI.hideTypingIndicator();
    const botResp = data.choices[0].message.content;

    // Display response and update state
    const msgType = isRoleplay ? "default" : "feedback";
    UI.appendMessage(botResp, "partner", {
      roleName: STATE.config.roleName,
      messageType: msgType,
      isIchMode: !isRoleplay,
    });

    STATE.chatHistory.push({ role: "assistant", content: botResp });

    if (!isRoleplay) {
      STATE.exerciseAwaitingRevision = true;
      UI.setExerciseActionsVisible(true);
    }

    if (STATE.ttsEnabled) UI.speak(botResp, STATE.config.roleName);
    UI.elements.feedbackBtn.disabled = false;
    UI.elements.feedbackBtn.classList.remove(
      "opacity-50",
      "cursor-not-allowed",
    );
    UI.elements.resetBtn.disabled = false;
    UI.elements.resetBtn.classList.remove("opacity-50", "cursor-not-allowed");
    UI.updateStatus(
      "idle",
      isRoleplay ? "Aktiv" : getTransformationProgressText(),
    );
  } catch (e) {
    UI.hideTypingIndicator();
    UI.updateStatus("error", e.message);
    console.error(e);
  } finally {
    UI.updateInputUI(
      false,
      isRoleplay ? `Nachricht an ${STATE.config.roleName}...` : "Eingabe...",
    );
    UI.elements.userInput.focus();
  }
}

async function handleFeedback() {
  if (STATE.chatHistory.length === 0) return;

  if (STATE.currentMode === "transformation") {
    downloadCurrentTranscript();
    return; // Im Übungsmodus direkt herunterladen, kein Modal öffnen
  }

  UI.elements.loadingOverlay.classList.remove("hidden"); // Nur für Mentor-Feedback anzeigen
  UI.updateStatus("loading", "Mentor...");
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
    UI.showFeedbackModal(data.choices[0].message.content); // Modal nur für Mentor-Feedback
    if (STATE.ttsEnabled) UI.speak(data.choices[0].message.content, "Mentor");
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
  UI.elements.downloadBtn?.addEventListener("click", downloadCurrentTranscript);

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
        const briefing = UI.elements.briefingContent.innerText;
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
