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
  answers: [],
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
  STATE.answers = [];
  UI.elements.chatWindow.innerHTML = "";
  UI.setBriefingExpanded(true);

  if (UI.elements.downloadBtn) {
    // Reset evaluation button state
    UI.elements.downloadBtn.disabled = true;
    UI.elements.downloadBtn.classList.remove("hidden");
    UI.elements.downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
    UI.elements.downloadBtn.querySelector("span + span").textContent =
      "Auswertung erstellen";
  }

  if (UI.elements.resetBtn) {
    // Disable restart button until user interacts
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  if (UI.elements.exportTranscriptBtn)
    // Hide transcript export button
    UI.elements.exportTranscriptBtn.classList.add("hidden");

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

  let scenarioTitle = "";
  if (
    UI.elements.exerciseSelect &&
    UI.elements.exerciseSelect.selectedIndex > 0
  ) {
    scenarioTitle =
      UI.elements.exerciseSelect.options[
        UI.elements.exerciseSelect.selectedIndex
      ].text;
    scenarioTitle = scenarioTitle.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").trim(); // Remove special characters, keep umlauts and hyphens
    scenarioTitle = scenarioTitle.replace(/\s+/g, "_"); // Replace spaces with underscores
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

  // Store the answer for later overall evaluation
  STATE.answers.push({
    statement: STATE.transformationStatements[STATE.exerciseIndex], // Current statement
    answer: userVal, // User's answer
  });

  // As soon as the first answer is given, allow early termination and restart
  [UI.elements.downloadBtn, UI.elements.resetBtn].forEach((btn) => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });

  if (UI.elements.feedbackBtn) UI.elements.feedbackBtn.classList.add("hidden"); // Old feedback button is no longer needed

  UI.elements.userInput.value = "";

  if (STATE.exerciseIndex < STATE.transformationStatements.length - 1) {
    // There are more statements: Continue directly
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
      UI.updateInputUI(false, "Nächste Eingabe...");
    }, 400);
  } else {
    // Last statement reached: Evaluate automatically
    finalizeExercise();
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

    // Adjust buttons after evaluation
    if (UI.elements.downloadBtn)
      UI.elements.downloadBtn.classList.add("hidden"); // hide "Create evaluation now"
    if (UI.elements.exportTranscriptBtn) {
      // show new "Download transcript" button
      UI.elements.exportTranscriptBtn.classList.remove("hidden");
      UI.elements.exportTranscriptBtn.disabled = false;
      UI.elements.exportTranscriptBtn.classList.remove(
        "opacity-50",
        "cursor-not-allowed",
      );
    }

    UI.updateStatus("idle", "Übung beendet");
  } catch (e) {
    UI.hideTypingIndicator();
    UI.updateStatus("error", "Fehler bei der Auswertung");
    UI.updateInputUI(false, "Eingabe...");
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
  STATE.answers = [];
  prepareModeSwitch();
  UI.setBriefingExpanded(true);

  STATE.transformationFeedbackPrompt = data.prompts.trainer;

  STATE.config.roleName = data.roleLabel || "Trainer"; // Set role name for the AI
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

  if (UI.elements.exportTranscriptBtn) {
    // Hide transcript export button
    UI.elements.exportTranscriptBtn.classList.add("hidden");
  }

  if (UI.elements.downloadBtn) {
    UI.elements.downloadBtn.disabled = true;
    UI.elements.downloadBtn.classList.remove("hidden");
    UI.elements.downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
    UI.elements.downloadBtn.querySelector("span + span").textContent =
      "Auswertung erstellen";
  }

  // Disable sidebar restart button initially
  if (UI.elements.resetBtn) {
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

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

  UI.elements.sendBtn.addEventListener("click", handleSend); // Send button for user input

  // The download button in the sidebar now becomes "Create evaluation now"
  UI.elements.downloadBtn?.addEventListener("click", () => {
    if (STATE.answers.length > 0 && !STATE.exerciseAwaitingRevision) {
      finalizeExercise();
    }
  });

  UI.elements.userInput.addEventListener(
    "keypress",
    (e) => e.key === "Enter" && handleSend(),
  );

  // Sidebar restart
  UI.elements.resetBtn?.addEventListener("click", () => {
    if (
      confirm(
        "Möchtest du die aktuelle Übung wirklich neu starten? Alle bisherigen Antworten gehen verloren.",
      )
    ) {
      restartTransformationExercise();
    }
  });

  // New button for transcript export, visible after evaluation
  UI.elements.exportTranscriptBtn?.addEventListener(
    "click",
    downloadCurrentTranscript,
  );

  // Existing event listeners
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

  // Setup TTS toggle with correct ID and initialization
  const ttsToggle = UI.elements.autoSpeakToggle;
  if (ttsToggle) {
    STATE.ttsEnabled = ttsToggle.checked;
    ttsToggle.addEventListener("change", (e) => {
      STATE.ttsEnabled = e.target.checked;

      if (STATE.ttsEnabled) {
        // Immediate feedback: If a briefing is open, read it aloud
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
