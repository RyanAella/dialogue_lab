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
  },
  chatHistory: [],
  currentMode: "roleplay",
  allExercises: [],
};

function prepareModeSwitch() {
  UI.elements.chatWindow.innerHTML = "";
  const main = UI.elements.chatWindow.closest("main");
  if (main) main.scrollTop = 0;
}

async function loadExercises() {
  try {
    const url = `${APP_CONFIG.EXERCISES_FILE}?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Exercises file could not be loaded: ${APP_CONFIG.EXERCISES_FILE}`,
      );
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
    throw error;
  }
}

async function switchToRoleplayMode() {
  STATE.currentMode = "roleplay";
  prepareModeSwitch();
  UI.setBriefingExpanded(true);

  await initScenarioDropdown();

  const simulationExercises = STATE.allExercises.filter(
    (ex) => ex.type === "SIMULATION",
  );
  if (simulationExercises.length > 0) {
    UI.elements.scenarioSelect.value = simulationExercises[0].id;
    UI.elements.scenarioSelect.dispatchEvent(new Event("change"));
    UI.updateStatus("idle", "Szenarien geladen");
  } else {
    UI.updateStatus("idle", "Keine Rollenspiel-Szenarien verfügbar.");
    UI.updateInputUI(true, "Keine Szenarien verfügbar.");
  }
  document.getElementById("main-subtitle").textContent =
    "Lies das Briefing und starte das Gespräch mit einer Nachricht.";
  UI.updateStatus("idle", "Simulationen aktiv");
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

  const filtered = STATE.allExercises.filter((ex) => ex.type === "SIMULATION");

  if (filtered.length === 0) {
    UI.elements.scenarioSelect.innerHTML =
      '<option value="" selected disabled>Keine Szenarien verfügbar</option>';
    UI.elements.scenarioSelect.disabled = true;
    return;
  }

  // Parallel fetching of all scenario titles for better performance
  const scenarioOptions = await Promise.all(
    filtered.map(async (ex) => {
      try {
        const title =
          (await API.fetchScenarioTitle(ex.config.scenarioFile)) || ex.id;
        return new Option(title, ex.id);
      } catch (e) {
        console.error("Error loading exercise metadata:", ex.id, e);
        return new Option(ex.id, ex.id);
      }
    }),
  );

  scenarioOptions.forEach((opt) => UI.elements.scenarioSelect.add(opt));
  UI.elements.scenarioSelect.disabled = false;
}

/**
 * Loads scenario details AND the corresponding prompt files
 */
UI.elements.scenarioSelect.addEventListener("change", async (event) => {
  const exerciseId = event.target.value;
  if (!exerciseId) return;

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
    UI.setBriefingExpanded(true);
    UI.elements.startInfo.classList.remove("hidden");
    UI.updateInputUI(false, `Deine Nachricht an ${STATE.config.roleName}...`);
    UI.elements.chatWindow.appendChild(UI.elements.startInfo);
    UI.updateStatus("idle", "Bereit");
  } catch (error) {
    console.error("Fehler beim Laden des Szenarios:", error);
    UI.elements.briefingContent.innerHTML =
      '<p class="text-red-500 p-4">Fehler.</p>';
    UI.updateStatus("error", "Ladefehler");
  }
});

async function handleSend() {
  const message = UI.elements.userInput.value.trim();
  if (!message || !STATE.config.systemPrompt) return;

  UI.setBriefingExpanded(false);

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
    console.error("Feedback Fehler:", e);
    UI.updateStatus("error", "Fehler");
  } finally {
    UI.elements.loadingOverlay.classList.add("hidden");
  }
}

UI.elements.sendBtn.addEventListener("click", handleSend);
UI.elements.userInput.addEventListener(
  "keypress",
  (e) => e.key === "Enter" && handleSend(),
);

UI.elements.resetBtn.addEventListener("click", () => UI.openResetModal());
UI.elements.briefingHeader.addEventListener("click", () => {
  const isHidden = UI.elements.briefingContent.classList.contains("hidden");
  UI.setBriefingExpanded(isHidden);
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
  try {
    await loadExercises();
    await switchToRoleplayMode();
  } catch (e) {
    console.error("App konnte nicht gestartet werden:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.updateSubtitleText();
  startApp();
});
window.addEventListener("resize", window.updateSubtitleText);
window.handleFeedback = handleFeedback;
