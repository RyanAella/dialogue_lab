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
  allExercises: [],
};

function prepareModeSwitch() {
  UI.elements.chatWindow.innerHTML = "";
  const main = UI.elements.chatWindow.closest("main");
  if (main) main.scrollTop = 0;
  UI.elements.briefingContent.classList.remove("hidden");
  UI.elements.exerciseActions?.classList.add("hidden");
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

function getIchBotschaftProgressText() {
  return STATE.ichBotschaftStatements.length
    ? `Aussage ${STATE.exerciseIndex + 1} von ${STATE.ichBotschaftStatements.length}`
    : "Bereit";
}

function restartIchBotschaftExercise() {
  if (STATE.currentMode !== "ich-botschaft") return;

  STATE.exerciseIndex = 0;
  STATE.exerciseAwaitingRevision = false;
  UI.elements.chatWindow.innerHTML = "";
  UI.setExerciseActionsVisible(false);
  const statement = STATE.ichBotschaftStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `Aussage 1:\n"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    { messageType: "task", isIchMode: true, shouldScroll: false },
  );
  UI.updateInputUI(false, "Eingabe...");
  UI.updateStatus("idle", `${getIchBotschaftProgressText()} (neu gestartet)`);
}
async function switchToRoleplayMode() {
  STATE.currentMode = "roleplay";
  STATE.exerciseAwaitingRevision = false;
  prepareModeSwitch();

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
  document.getElementById("main-subtitle").textContent =
    "Lies das Briefing und starte das Gespräch mit einer Nachricht.";
  UI.setModeBadge("roleplay");
  UI.updateStatus("idle", "Simulationen aktiv");
  // If scenarioFiles is empty, status will already be set by loadExercises or initScenarioDropdown
}

// =========================================================
// 2. Scenario & Dropdown Logic
// =========================================================

/**
 * Fills the dropdown and adds a disabled placeholder option.
 */
async function initScenarioDropdown() {
  UI.elements.scenarioSelect.innerHTML =
    '<option value="" selected disabled>Wähle eine Übung...</option>';

  // Filtere Übungen basierend auf dem aktuellen Modus
  const targetType =
    STATE.currentMode === "roleplay" ? "SIMULATION" : "TRANSFORMATION";
  const filtered = STATE.allExercises.filter((ex) => ex.type === targetType);

  if (filtered.length === 0) {
    UI.elements.scenarioSelect.innerHTML =
      '<option value="" selected disabled>Keine Szenarien verfügbar</option>';
    UI.elements.scenarioSelect.disabled = true;
    return;
  }

  for (const ex of filtered) {
    try {
      const filePath =
        ex.type === "SIMULATION"
          ? ex.config.scenarioFile
          : ex.config.instructionFile;
      const title = (await API.fetchScenarioTitle(filePath)) || ex.id;
      UI.elements.scenarioSelect.add(new Option(title, ex.id));
    } catch (e) {
      console.error("Error loading exercise metadata:", ex.id, e);
    }
  }
  UI.elements.scenarioSelect.disabled = false;
}

/**
 * Loads scenario details AND the corresponding prompt files
 */
UI.elements.scenarioSelect.addEventListener("change", async (event) => {
  const exerciseId = event.target.value;
  if (!exerciseId) return;

  if (STATE.currentMode === "ich-botschaft") {
    await switchToTransformationMode(exerciseId);
    return;
  }

  const exConfig = STATE.allExercises.find(
    (ex) => ex.id === exerciseId,
  )?.config;
  if (!exConfig) return;

  UI.updateStatus("loading", "Lade...");
  UI.setBriefingLoading(true);
  UI.elements.chatWindow.innerHTML = "";
  STATE.chatHistory = [];

  try {
    const data = await API.fetchCompleteScenario(exConfig.scenarioFile);

    STATE.config.roleName = Utils.extractRoleName(
      data.instructionSection,
      data.roleLabel,
    );
    STATE.config.systemPrompt = data.prompts.system;
    STATE.config.partnerPrompt = data.prompts.partner;
    STATE.config.mentorPrompt = data.prompts.mentor;

    Utils.renderBoldMarkdownWithLineBreaks(
      UI.elements.briefingContent,
      data.instructionSection,
    );
    UI.elements.chevron.style.transform = "rotate(0deg)";
    UI.elements.startInfo.classList.remove("hidden");
    UI.updateInputUI(false, `Deine Nachricht an ${STATE.config.roleName}...`);
    UI.elements.chatWindow.appendChild(UI.elements.startInfo);
    UI.updateStatus("idle", "Bereit");
  } catch (error) {
    UI.elements.briefingContent.innerHTML =
      '<p class="text-red-500 p-4">Fehler.</p>';
    UI.updateStatus("error", "Ladefehler");
  }
});

async function handleSend() {
  if (STATE.currentMode === "ich-botschaft") {
    await handleIchBotschaftSend();
    return;
  }
  const message = UI.elements.userInput.value.trim();
  if (!message || !STATE.config.systemPrompt) return;

  if (!UI.elements.briefingContent.classList.contains("hidden")) {
    UI.elements.briefingContent.classList.add("hidden");
    UI.elements.chevron.style.transform = "rotate(90deg)";
  }

  UI.updateInputUI(true, "Sende...");
  UI.elements.startInfo.classList.add("hidden");
  UI.appendMessage(message, "user", { roleName: STATE.config.roleName });
  UI.updateStatus("loading", "Antwortet...");
  UI.elements.userInput.value = "";

  const typing = document.createElement("div");
  typing.className =
    "self-start text-xs text-gray-400 italic mb-4 animate-pulse";
  typing.textContent = `${STATE.config.roleName} schreibt...`;
  UI.elements.chatWindow.appendChild(typing);

  if (STATE.chatHistory.length === 0) {
    STATE.chatHistory.push({
      role: "system",
      content: `${STATE.config.systemPrompt}\n\n${STATE.config.partnerPrompt}`,
    });
  }
  STATE.chatHistory.push({ role: "user", content: message });

  try {
    const data = await API.callChatApi(STATE.chatHistory, {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: APP_CONFIG.CHAT_TEMPERATURE,
    });
    if (UI.elements.chatWindow.contains(typing))
      UI.elements.chatWindow.removeChild(typing);
    const botResp = data.choices[0].message.content;
    STATE.chatHistory.push({ role: "assistant", content: botResp });
    UI.appendMessage(botResp, "partner", { roleName: STATE.config.roleName });
    UI.elements.feedbackBtn.disabled = false;
    UI.elements.feedbackBtn.classList.remove(
      "opacity-50",
      "cursor-not-allowed",
    );
    UI.elements.resetBtn.disabled = false;
    UI.elements.resetBtn.classList.remove("opacity-50", "cursor-not-allowed");
    UI.updateStatus("idle", "Aktiv");
  } catch (e) {
    UI.updateStatus("error", "Fehler");
    if (UI.elements.chatWindow.contains(typing))
      UI.elements.chatWindow.removeChild(typing);
  } finally {
    UI.updateInputUI(false, `Nachricht an ${STATE.config.roleName}...`);
    UI.elements.userInput.focus();
  }
}

async function handleIchBotschaftSend() {
  const userVal = UI.elements.userInput.value.trim();
  if (!userVal) return;
  UI.appendMessage(userVal, "user", { isIchMode: true });
  UI.elements.userInput.value = "";
  UI.updateInputUI(true, "Feedback...");
  UI.updateStatus("loading", "Trainer...");

  try {
    const data = await API.callChatApi(
      [
        { role: "system", content: STATE.ichBotschaftFeedbackPrompt },
        {
          role: "user",
          content: `Statement: ${STATE.ichBotschaftStatements[STATE.exerciseIndex]}\nUser: ${userVal}`,
        },
      ],
      {
        proxyUrl: APP_CONFIG.PROXY_URL,
        model: APP_CONFIG.MODEL,
        temperature: APP_CONFIG.ICH_BOTSCHAFT_TEMPERATURE,
      },
    );
    UI.appendMessage(data.choices[0].message.content, "partner", {
      messageType: "feedback",
      isIchMode: true,
    });
    UI.setExerciseActionsVisible(true);
    STATE.exerciseAwaitingRevision = true;
    UI.updateStatus("idle", getIchBotschaftProgressText());
  } catch (e) {
    UI.updateStatus("error", "API Fehler");
    UI.updateInputUI(false, "Eingabe..."); // Re-enable only on error to allow retry
  }
}

async function handleFeedback() {
  if (STATE.chatHistory.length === 0) return;
  UI.elements.loadingOverlay.classList.remove("hidden");
  UI.updateStatus("loading", "Mentor...");
  const transcript = STATE.chatHistory
    .filter((m) => m.role !== "system")
    .map(
      (m) =>
        `${m.role === "user" ? "Führungskraft" : STATE.config.roleName}: ${m.content}`,
    )
    .join("\n\n");

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
    UI.updateStatus("idle", "Fertig");
  } catch (e) {
    UI.updateStatus("error", "Fehler: " + e.message);
  } finally {
    UI.elements.loadingOverlay.classList.add("hidden");
  }
}

async function switchToTransformationMode(
  exerciseId = "ich_botschaften_basis",
) {
  UI.elements.scenarioSelect.value = exerciseId;
  const config = STATE.allExercises.find((ex) => ex.id === exerciseId)?.config;
  const response = await fetch(`${config.sourceFile}?t=${Date.now()}`);
  const content = await response.text();
  STATE.ichBotschaftStatements = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  STATE.currentMode = "ich-botschaft";
  STATE.exerciseIndex = 0;
  STATE.chatHistory = [];
  prepareModeSwitch();
  UI.elements.chevron.style.transform = "rotate(0deg)";

  const data = await API.fetchCompleteScenario(config.instructionFile);
  STATE.ichBotschaftFeedbackPrompt = data.prompts.trainer;

  STATE.config.shortInstruction =
    data.shortInstruction || "Bearbeite die Aussage.";
  document.getElementById("main-subtitle").textContent =
    `${data.title}: ${STATE.config.shortInstruction}`;
  Utils.renderBoldMarkdownWithLineBreaks(
    UI.elements.briefingContent,
    data.instructionSection,
  );
  UI.setModeBadge("ich-botschaft");
  UI.setExerciseActionsVisible(false);
  UI.updateInputUI(false, "Eingabe...");
  const statement = STATE.ichBotschaftStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `Aussage 1:\n"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    { messageType: "task", isIchMode: true, shouldScroll: false },
  );
  UI.updateStatus("idle", getIchBotschaftProgressText());
}

UI.elements.sendBtn.addEventListener("click", handleSend);
UI.elements.userInput.addEventListener(
  "keypress",
  (e) => e.key === "Enter" && handleSend(),
);

UI.elements.modeSelect?.addEventListener("change", async (e) => {
  const selectedMode = e.target.value;
  STATE.currentMode = selectedMode; // Modus sofort aktualisieren

  if (selectedMode === "ich-botschaft") {
    await initScenarioDropdown();
    const firstEx = STATE.allExercises.find(
      (ex) => ex.type === "TRANSFORMATION",
    );
    if (firstEx) await switchToTransformationMode(firstEx.id);
  } else await switchToRoleplayMode();
});

UI.elements.nextExerciseBtn?.addEventListener("click", () => {
  if (STATE.exerciseIndex >= STATE.ichBotschaftStatements.length - 1) {
    UI.appendMessage("Alle erledigt!", "partner", { isIchMode: true });
    return;
  }
  STATE.exerciseIndex++;
  STATE.exerciseAwaitingRevision = false;
  UI.setExerciseActionsVisible(false);
  const statement = STATE.ichBotschaftStatements[STATE.exerciseIndex];
  UI.appendMessage(
    `Aussage ${STATE.exerciseIndex + 1}:\n"${statement}"\n\n${STATE.config.shortInstruction}`,
    "partner",
    { messageType: "task", isIchMode: true },
  );
  UI.updateStatus("idle", getIchBotschaftProgressText());
  UI.updateInputUI(false, "Eingabe...");
  UI.elements.userInput.focus();
});

UI.elements.reviseBtn?.addEventListener("click", () => {
  UI.setExerciseActionsVisible(false);
  STATE.exerciseAwaitingRevision = false;
  UI.updateInputUI(false, "Eingabe korrigieren...");
  UI.elements.userInput.focus();
});

UI.elements.restartExerciseBtn?.addEventListener("click", () => {
  restartIchBotschaftExercise();
});

UI.elements.resetBtn.addEventListener("click", () => UI.openResetModal());
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

// =========================================================
// 4. Execution & Listeners
// =========================================================
async function startApp() {
  await loadExercises();
  STATE.currentMode = UI.elements.modeSelect?.value || "roleplay";
  await initScenarioDropdown();
  if (STATE.currentMode === "ich-botschaft")
    await switchToTransformationMode(
      STATE.allExercises.find((ex) => ex.type === "TRANSFORMATION").id,
    );
  else await switchToRoleplayMode();
}

document.addEventListener("DOMContentLoaded", () => {
  window.updateSubtitleText();
  startApp();
});
window.addEventListener("resize", window.updateSubtitleText);
window.handleFeedback = handleFeedback;
