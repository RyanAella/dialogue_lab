import { API } from "./api.js";
import { APP_CONFIG } from "./config.js";
import { UI, updateSubtitleText } from "./ui.js";
import { Utils } from "./utils.js";

// =========================================================
// 1. App State & Global Definitions
// =========================================================

/** Centralized state object to manage the application lifecycle and data */
const STATE = {
  config: {
    shortInstruction: "",
    roleName: "Trainer",
  },
  exerciseIndex: 0,
  exerciseAwaitingRevision: false,
  transformationStatements: [],
  transformationFeedbackPrompt: "",
  allExercises: [],
  ttsEnabled: false,
  chatHistory: [],
  currentMode: "transformation",
};

/**
 * Resets UI components and state before switching to a different exercise or mode.
 * Clears chat window, resets scroll position, and ensures instructions are visible.
 */
function prepareModeSwitch() {
  UI.elements.chatWindow.innerHTML = "";
  const main = UI.elements.chatWindow.closest("main");
  if (main) main.scrollTop = 0;
  UI.elements.briefingContent.classList.remove("hidden");
  UI.elements.exerciseActions?.classList.add("hidden");
}

/**
 * Asynchronously fetches the main exercise configuration JSON.
 * Handles error states by updating the UI status and briefing area.
 */
async function loadExercises() {
  try {
    const response = await fetch(
      // Use a timestamp to prevent browser caching
      `${APP_CONFIG.EXERCISES_FILE}?t=${Date.now()}`,
    );
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
 * Generates a progress string for the current transformation exercise series.
 * @returns {string} e.g., "Aussage 1 von 10" or "Bereit"
 */
function getTransformationProgressText() {
  return STATE.transformationStatements.length
    ? `Aussage ${STATE.exerciseIndex + 1} von ${STATE.transformationStatements.length}`
    : "Bereit";
}

/**
 * Resets the current transformation exercise to the first statement.
 * Resets counters, clears chat, and reappends the first task message.
 */
function restartTransformationExercise() {
  STATE.exerciseIndex = 0;
  STATE.transformationStatements = Utils.shuffleArray(
    STATE.transformationStatements,
  );
  STATE.exerciseAwaitingRevision = false;
  STATE.chatHistory = [];
  UI.elements.chatWindow.innerHTML = "";
  UI.setExerciseActionsVisible(false);

  UI.elements.downloadBtn.disabled = true;
  UI.elements.downloadBtn.classList.add("opacity-50", "cursor-not-allowed");

  const statement = STATE.transformationStatements[STATE.exerciseIndex];
  const taskText = `"${statement}"\n\n${STATE.config.shortInstruction}`;
  STATE.chatHistory.push({ role: "assistant", content: taskText });
  UI.appendMessage(taskText, "partner", {
    roleName: STATE.config.roleName,
    isIchMode: true,
    messageType: "task",
    shouldScroll: false,
  });
  if (STATE.ttsEnabled) UI.speak(taskText, STATE.config.roleName);
  UI.updateInputUI(false, "Eingabe...");
  UI.updateStatus("idle", `${getTransformationProgressText()} (neu gestartet)`);
}

// =========================================================
// 2. Exercise Selection & Navigation Logic
// =========================================================

/**
 * Populates the sidebar exercise selection dropdown menu using the loaded exercise list.
 */
async function initExerciseDropdown() {
  UI.elements.exerciseSelect.innerHTML =
    '<option value="" selected disabled>Wähle eine Übung...</option>';

  if (STATE.allExercises.length === 0) {
    UI.elements.exerciseSelect.innerHTML =
      '<option value="" selected disabled>Keine Übungen verfügbar</option>';
    UI.elements.exerciseSelect.disabled = true;
    return;
  }

  // Parallel loading of all titles for better performance
  const titlePromises = STATE.allExercises.map(async (ex) => {
    try {
      const title = await API.fetchScenarioTitle(ex.config.instructionFile);
      return { id: ex.id, title: title || ex.id };
    } catch (e) {
      return { id: ex.id, title: ex.id };
    }
  });

  const results = await Promise.all(titlePromises);
  results.forEach(({ id, title }) => {
    UI.elements.exerciseSelect.add(new Option(title, id));
  });

  UI.elements.exerciseSelect.disabled = false;
}

// Function to download the current chat transcript
function downloadCurrentTranscript() {
  const briefing = UI.elements.briefingContent?.textContent.trim() || "";
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

  const modePrefix = "Transformation";
  filenameParts.push(modePrefix);

  // Szenario-Titel hinzufügen
  let scenarioTitle = "";
  if (
    UI.elements.exerciseSelect &&
    UI.elements.exerciseSelect.selectedIndex > 0
  ) {
    scenarioTitle =
      UI.elements.exerciseSelect.options[
        UI.elements.exerciseSelect.selectedIndex
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
 * Returns the correct message payload and temperature
 */
function getApiPayload(userMessage) {
  return {
    messages: [
      { role: "system", content: STATE.transformationFeedbackPrompt },
      {
        role: "user",
        content: `Statement: ${STATE.transformationStatements[STATE.exerciseIndex]}\nUser: ${userMessage}`,
      },
    ],
    temperature: APP_CONFIG.TRANSFORMATION_TEMPERATURE,
  };
}

/**
 * Main entry point for sending messages.
 * Routes the input to the appropriate handler based on the current mode.
 */
async function handleSend() {
  const userVal = UI.elements.userInput.value.trim();
  if (!userVal) return;

  UI.elements.briefingContent.classList.add("hidden");
  UI.elements.chevron.style.transform = "rotate(90deg)";

  UI.appendMessage(userVal, "user", { isIchMode: true });
  if (STATE.ttsEnabled) UI.speak(userVal, "Ich");
  STATE.chatHistory.push({ role: "user", content: userVal });
  UI.elements.userInput.value = "";
  UI.updateInputUI(true, "Feedback...");
  UI.updateStatus("loading", "Trainer...");
  UI.showTypingIndicator(STATE.config.roleName);

  try {
    const { messages, temperature } = getApiPayload(userVal);
    const data = await API.callChatApi(messages, {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: temperature,
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

    UI.setExerciseActionsVisible(true);
    STATE.exerciseAwaitingRevision = true;

    // Download-Button aktivieren
    UI.elements.downloadBtn.disabled = false;
    UI.elements.downloadBtn.classList.remove(
      "opacity-50",
      "cursor-not-allowed",
    );

    UI.updateStatus("idle", getTransformationProgressText());
  } catch (e) {
    UI.hideTypingIndicator();
    UI.updateStatus("error", "API Fehler");
    UI.updateInputUI(false, "Eingabe..."); // Re-enable only on error to allow retry
  }
}

/**
 * Sets up the application for a specific transformation (exercise) mode.
 * Loads statements and instructional metadata.
 * @param {string} exerciseId - The ID defined in exercises.json
 */
async function switchToTransformationMode(
  exerciseId = "ich_botschaften_basis",
) {
  UI.elements.exerciseSelect.value = exerciseId;
  const config = STATE.allExercises.find((ex) => ex.id === exerciseId)?.config;

  UI.updateStatus("loading", "Lade Übungsdaten...");

  // Load both the statements and the exercise metadata in parallel
  const [sourceRes, data] = await Promise.all([
    fetch(`${config.sourceFile}?t=${Date.now()}`),
    API.fetchCompleteScenario(config.instructionFile),
  ]);

  const content = await sourceRes.text();

  // Split file content into an array of trimmed lines, ignoring empty lines or comments
  STATE.transformationStatements = Utils.shuffleArray(
    content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#")),
  );

  STATE.exerciseIndex = 0;
  prepareModeSwitch();
  UI.setBriefingExpanded(true);

  STATE.transformationFeedbackPrompt = data.prompts.trainer;

  STATE.config.roleName = data.roleLabel || "Trainer";
  STATE.config.shortInstruction =
    data.shortInstruction || "Bearbeite die Aussage.";

  const mainSubtitle = document.getElementById("main-subtitle");
  if (mainSubtitle) {
    mainSubtitle.textContent = `${data.title}: ${STATE.config.shortInstruction}`;
  }

  // Render the briefing section with bold text support
  Utils.renderBoldMarkdownWithLineBreaks(
    UI.elements.briefingContent,
    data.instructionSection,
  );
  if (STATE.ttsEnabled) UI.speak(data.instructionSection, "Briefing");

  UI.setExerciseActionsVisible(false);
  UI.updateInputUI(false, "Eingabe...");

  const statement = STATE.transformationStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    {
      roleName: STATE.config.roleName,
      isIchMode: true,
      messageType: "task",
      shouldScroll: false,
    },
  );
  UI.updateStatus("idle", getTransformationProgressText());
}

// =========================================================
// 3. UI Event Listeners
// =========================================================

function setupEventListeners() {
  /**
   * Event Listener for the exercise selection dropdown.
   * Triggers the mode switch and data loading for the selected ID.
   */
  UI.elements.exerciseSelect.addEventListener("change", async (event) => {
    const exerciseId = event.target.value;
    const ex = STATE.allExercises.find((e) => e.id === exerciseId);
    if (!ex) return;

    await switchToTransformationMode(exerciseId);
  });

  UI.elements.sendBtn.addEventListener("click", handleSend);
  UI.elements.userInput.addEventListener(
    "keypress",
    (e) => e.key === "Enter" && handleSend(),
  );
  UI.elements.downloadBtn?.addEventListener("click", downloadCurrentTranscript);

  UI.elements.nextExerciseBtn?.addEventListener("click", () => {
    if (STATE.exerciseIndex >= STATE.transformationStatements.length - 1) {
      UI.appendMessage("Alle erledigt!", "partner", {
        roleName: STATE.config.roleName,
      });
      UI.setExerciseActionsVisible(false);
      return;
    }
    STATE.exerciseIndex++;
    STATE.exerciseAwaitingRevision = false;
    UI.setExerciseActionsVisible(false);
    const statement = STATE.transformationStatements[STATE.exerciseIndex];
    const taskText = `"${statement}"\n\n${STATE.config.shortInstruction}`;
    UI.appendMessage(taskText, "partner", {
      roleName: STATE.config.roleName,
      isIchMode: true,
      messageType: "task",
      shouldScroll: false,
    });
    if (STATE.ttsEnabled) UI.speak(taskText, STATE.config.roleName);
    UI.updateStatus("idle", getTransformationProgressText());
    UI.updateInputUI(false, "Eingabe...");
    UI.elements.userInput.focus();
  });

  UI.elements.reviseBtn?.addEventListener("click", () => {
    UI.setExerciseActionsVisible(false);
    STATE.exerciseAwaitingRevision = false;
    UI.updateInputUI(false, "Eingabe korrigieren...");
    UI.elements.userInput.focus();
  });

  UI.elements.restartExerciseBtn?.addEventListener("click", () =>
    restartTransformationExercise(),
  );

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
    () => window.innerWidth < 1024 && UI.setBriefingExpanded(false),
  );
}

// =========================================================
// 4. Execution & Listeners
// =========================================================

/** Bootstraps the application, loading initial data and starting the first exercise. */
async function startApp() {
  UI.init(); // Bind DOM elements first so they are available for following calls
  await loadExercises();
  await initExerciseDropdown();
  setupEventListeners();

  // Setup TTS toggle mit korrekter ID und Initialisierung
  const ttsToggle = UI.elements.autoSpeakToggle;
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

  /**
   * Automatically start with the first available transformation exercise.
   */
  const firstTransformation = STATE.allExercises.find(
    (ex) => ex.type === "TRANSFORMATION",
  );
  if (firstTransformation) {
    await switchToTransformationMode(firstTransformation.id);
  }
}

// Initialization on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  updateSubtitleText();
  startApp();
});
window.addEventListener("resize", updateSubtitleText);
