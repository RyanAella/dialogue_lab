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
  },
  exerciseIndex: 0,
  exerciseAwaitingRevision: false,
  transformationStatements: [],
  transformationFeedbackPrompt: "",
  allExercises: [],
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
  STATE.exerciseAwaitingRevision = false;
  UI.elements.chatWindow.innerHTML = "";
  UI.setExerciseActionsVisible(false);
  const statement = STATE.transformationStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `Aussage 1:\n"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    { messageType: "task", isIchMode: true, shouldScroll: false },
  );
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

  for (const ex of STATE.allExercises) {
    try {
      const filePath = ex.config.instructionFile;
      const title = (await API.fetchExerciseTitle(filePath)) || ex.id;
      UI.elements.exerciseSelect.add(new Option(title, ex.id));
    } catch (e) {
      console.error("Error loading exercise metadata:", ex.id, e);
    }
  }
  UI.elements.exerciseSelect.disabled = false;
}

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

/**
 * Main entry point for sending messages.
 * Routes the input to the appropriate handler based on the current mode.
 */
async function handleSend() {
  await handleTransformationSend();
}

/**
 * Processes user input specifically for transformation (e.g., I-Message) exercises.
 * Calls the AI API via the proxy for qualitative feedback
 * and updates the UI accordingly.
 */
async function handleTransformationSend() {
  const userVal = UI.elements.userInput.value.trim();
  if (!userVal) return;
  UI.appendMessage(userVal, "user", { isIchMode: true });
  UI.elements.userInput.value = "";
  UI.updateInputUI(true, "Feedback...");
  UI.updateStatus("loading", "Trainer...");

  try {
    // Prepare messages for the LLM to analyze the transformation
    const data = await API.callChatApi(
      [
        { role: "system", content: STATE.transformationFeedbackPrompt },
        {
          role: "user",
          content: `Statement: ${STATE.transformationStatements[STATE.exerciseIndex]}\nUser: ${userVal}`,
        },
      ],
      {
        proxyUrl: APP_CONFIG.PROXY_URL,
        model: APP_CONFIG.MODEL,
        temperature: APP_CONFIG.TRANSFORMATION_TEMPERATURE,
      },
    );

    // Display feedback message
    UI.appendMessage(data.choices[0].message.content, "partner", {
      messageType: "feedback",
      isIchMode: true,
    });

    UI.setExerciseActionsVisible(true);
    STATE.exerciseAwaitingRevision = true;
    UI.updateStatus("idle", getTransformationProgressText());
  } catch (e) {
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

  // Load raw statements from the source .txt file
  const response = await fetch(`${config.sourceFile}?t=${Date.now()}`);
  const content = await response.text();
  // Split file content into an array of trimmed lines, ignoring empty lines or comments
  STATE.transformationStatements = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  STATE.exerciseIndex = 0;
  prepareModeSwitch();
  UI.elements.chevron.style.transform = "rotate(0deg)";

  // Load detailed exercise metadata (prompts, instructions) via the API module
  const data = await API.fetchCompleteExercise(config.instructionFile);
  STATE.transformationFeedbackPrompt = data.prompts.trainer;

  STATE.config.shortInstruction =
    data.shortInstruction || "Bearbeite die Aussage.";

  document.getElementById("main-subtitle").textContent =
    `${data.title}: ${STATE.config.shortInstruction}`;

  // Render the briefing section with bold text support
  Utils.renderBoldMarkdownWithLineBreaks(
    UI.elements.briefingContent,
    data.instructionSection,
  );
  UI.setExerciseActionsVisible(false);
  UI.updateInputUI(false, "Eingabe...");

  const statement = STATE.transformationStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `Aussage 1:\n"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    { messageType: "task", isIchMode: true, shouldScroll: false },
  );
  UI.updateStatus("idle", getTransformationProgressText());
}

// =========================================================
// 3. UI Event Listeners
// =========================================================

// Primary interaction handlers
UI.elements.sendBtn.addEventListener("click", handleSend);
UI.elements.userInput.addEventListener(
  "keypress",
  (e) => e.key === "Enter" && handleSend(),
);

/**
 * Advances the user to the next statement in the exercise series.
 * Resets input state and shows completion message if no statements are left.
 */
UI.elements.nextExerciseBtn?.addEventListener("click", () => {
  if (STATE.exerciseIndex >= STATE.transformationStatements.length - 1) {
    UI.appendMessage("Alle erledigt!", "partner", { isIchMode: true });
    UI.setExerciseActionsVisible(false);
    return;
  }
  STATE.exerciseIndex++;
  STATE.exerciseAwaitingRevision = false;
  UI.setExerciseActionsVisible(false);
  const statement = STATE.transformationStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `Aussage ${STATE.exerciseIndex + 1}:\n"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    { messageType: "task", isIchMode: true },
  );
  UI.updateStatus("idle", getTransformationProgressText());
  UI.updateInputUI(false, "Eingabe...");
  UI.elements.userInput.focus();
});

/** Allows the user to re-edit their last input after receiving feedback. */
UI.elements.reviseBtn?.addEventListener("click", () => {
  UI.setExerciseActionsVisible(false);
  STATE.exerciseAwaitingRevision = false;
  UI.updateInputUI(false, "Eingabe korrigieren...");
  UI.elements.userInput.focus();
});

/** Restarts the entire series of statements for the current exercise */
UI.elements.restartExerciseBtn?.addEventListener("click", () => {
  restartTransformationExercise();
});

/** Toggles visibility of the instructional briefing. */
UI.elements.briefingHeader.addEventListener("click", () => {
  const h = UI.elements.briefingContent.classList.toggle("hidden");
  UI.elements.chevron.style.transform = h ? "rotate(90deg)" : "rotate(0deg)";
});

// Sidebar mobile controls
UI.elements.mobileMenuBtn?.addEventListener("click", () =>
  UI.toggleMobileMenu(),
);

UI.elements.sidebarOverlay?.addEventListener("click", () =>
  UI.toggleMobileMenu(true),
);

/** Collapses briefing automatically on mobile when user starts typing. */
UI.elements.userInput.addEventListener(
  "focus",
  () =>
    window.innerWidth < 1024 &&
    UI.elements.briefingContent.classList.add("hidden"),
);

// =========================================================
// 4. Execution & Listeners
// =========================================================

/** Bootstraps the application, loading initial data and starting the first exercise. */
async function startApp() {
  await loadExercises();
  await initExerciseDropdown();

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
