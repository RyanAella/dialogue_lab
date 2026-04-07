// =========================================================
// 1. Elements & Configuration
// =========================================================
const briefingHeader = document.getElementById("briefing-header");
const briefingContent = document.getElementById("briefing-content");
const chevron = document.getElementById("chevron");
const scenarioSelect = document.getElementById("scenarios");
const chatWindow = document.getElementById("chat-window");
const startInfo = document.getElementById("start-info");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusBox = document.getElementById("status-box");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const modeBadge = document.getElementById("mode-badge");
const scenarioLabel = document.getElementById("scenario-label");
const modeSelect = document.getElementById("mode-select");
const exerciseActions = document.getElementById("exercise-actions");
const restartExerciseBtn = document.getElementById("restart-exercise-btn");
const reviseBtn = document.getElementById("revise-btn");
const nextExerciseBtn = document.getElementById("next-exercise-btn");
const APP_CONFIG = window.APP_CONFIG || {};
const PROXY_URL = APP_CONFIG.PROXY_URL || "https://kite2.site/chat.php";
const MODEL = APP_CONFIG.MODEL || "gpt-4o";
const CHAT_TEMPERATURE = APP_CONFIG.CHAT_TEMPERATURE ?? 0.7;
const MENTOR_TEMPERATURE = APP_CONFIG.MENTOR_TEMPERATURE ?? 0.3;
const ICH_BOTSCHAFT_TEMPERATURE = APP_CONFIG.ICH_BOTSCHAFT_TEMPERATURE ?? 0.4;
const ICH_BOTSCHAFT_MODE_CONFIG_FILE = "scenarios/ich_botschaft_mode.json";

// Store the loaded prompt contents here
let currentConfig = {
  systemPrompt: "",
  partnerPrompt: "",
  mentorPrompt: "",
  roleName: "Teammitglied", // Standard Name
};

let chatHistory = [];
let currentMode = "roleplay";
let exerciseIndex = 0;
let exerciseAwaitingRevision = false;
let ichBotschaftStatements = [];
let ichBotschaftFeedbackPrompt = "";
let pendingIchMessageType = null;
let scenarioFiles = [];
let ichBotschaftModeConfig = {
  statementsFile: "scenarios/ich_botschaft_statements.txt",
  feedbackPromptFile: "prompts/system/ich_botschaft_feedback_prompt.txt",
};

const scenarioFilesFallback = ["reporting_scenario.txt", "difficulties_scenario.txt"];
const scenarioIndexFile = "scenarios/index.json";
async function loadIchBotschaftFeedbackPrompt() {
  const response = await fetch(
    `${ichBotschaftModeConfig.feedbackPromptFile}?t=${Date.now()}`,
  );
  if (!response.ok) {
    throw new Error("Feedback-Prompt-Datei konnte nicht geladen werden.");
  }

  const content = (await response.text()).trim();
  if (!content) {
    throw new Error("Feedback-Prompt-Datei ist leer.");
  }

  ichBotschaftFeedbackPrompt = content;
}

function appendTextWithLineBreaks(container, text) {
  const lines = String(text).split("\n");
  lines.forEach((line, index) => {
    container.appendChild(document.createTextNode(line));
    if (index < lines.length - 1) {
      container.appendChild(document.createElement("br"));
    }
  });
}

function renderBoldMarkdownWithLineBreaks(container, text) {
  container.textContent = "";

  // Very small markdown subset: **bold**
  const parts = String(text).split(/\*\*(.*?)\*\*/g);
  parts.forEach((part, index) => {
    if (!part) return;

    if (index % 2 === 1) {
      const strong = document.createElement("strong");
      appendTextWithLineBreaks(strong, part);
      container.appendChild(strong);
      return;
    }

    appendTextWithLineBreaks(container, part);
  });
}

async function callChatApi(messages, temperature) {
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
    }),
  });

  return response.json();
}

function parseMetaValue(metaSection, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = metaSection.match(new RegExp(`^\\s*${escapedKey}:\\s*(.+)$`, "mi"));
  return match?.[1].trim() || "";
}

function parseScenarioContent(rawScenario) {
  const parts = rawScenario.split(/###\s*GUI INSTRUCTION\s*###/i);
  if (parts.length < 2) {
    throw new Error("Szenarioformat ungültig: Marker '### GUI INSTRUCTION ###' fehlt.");
  }

  const metaSection = parts[0];
  const instructionSection = parts.slice(1).join("### GUI INSTRUCTION ###").trim();

  if (!instructionSection) {
    throw new Error("Szenarioformat ungültig: GUI Instruction ist leer.");
  }

  const parsed = {
    title: parseMetaValue(metaSection, "title"),
    systemPromptFile: parseMetaValue(metaSection, "system_prompt"),
    partnerPromptFile: parseMetaValue(metaSection, "partner_prompt"),
    mentorPromptFile: parseMetaValue(metaSection, "mentor_prompt"),
    roleLabel: parseMetaValue(metaSection, "role_label"),
    instructionSection,
  };

  if (!parsed.systemPromptFile || !parsed.partnerPromptFile || !parsed.mentorPromptFile) {
    throw new Error(
      "Szenarioformat ungültig: 'system_prompt', 'partner_prompt' und 'mentor_prompt' sind erforderlich.",
    );
  }

  return parsed;
}

async function loadScenarioIndex() {
  try {
    const response = await fetch(`${scenarioIndexFile}?t=${Date.now()}`);
    if (!response.ok) {
      scenarioFiles = [...scenarioFilesFallback];
      return;
    }

    const indexData = await response.json();
    if (
      Array.isArray(indexData?.scenarioFiles) &&
      indexData.scenarioFiles.length > 0
    ) {
      scenarioFiles = indexData.scenarioFiles;
      return;
    }

    scenarioFiles = [...scenarioFilesFallback];
  } catch (error) {
    console.error("Szenario-Index konnte nicht geladen werden:", error);
    scenarioFiles = [...scenarioFilesFallback];
  }
}

function setExerciseActionsVisible(visible) {
  if (!exerciseActions) return;
  exerciseActions.classList.toggle("hidden", !visible);
}

function setScenarioSelectionVisible(visible) {
  scenarioSelect.classList.toggle("hidden", !visible);
  scenarioLabel?.classList.toggle("hidden", !visible);
}

function setMainSubtitle(text) {
  const mainSubtitle = document.getElementById("main-subtitle");
  if (!mainSubtitle) return;
  mainSubtitle.textContent = text;
}

function setModeBadge(mode) {
  if (!modeBadge) return;
  if (mode === "ich-botschaft") {
    modeBadge.textContent = "Modus: Ich-Botschaften";
    modeBadge.className =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200";
    return;
  }

  modeBadge.textContent = "Modus: Gesprächstraining";
  modeBadge.className =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200";
}

function getIchBotschaftProgressText() {
  if (!ichBotschaftStatements.length) {
    return "Ich-Botschaften bereit";
  }
  return `Aussage ${exerciseIndex + 1} von ${ichBotschaftStatements.length}`;
}

async function loadIchBotschaftStatements() {
  const response = await fetch(
    `${ichBotschaftModeConfig.statementsFile}?t=${Date.now()}`,
  );
  if (!response.ok) {
    throw new Error("Aussagen-Datei konnte nicht geladen werden.");
  }

  const content = await response.text();
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length === 0) {
    throw new Error("Aussagen-Datei ist leer.");
  }

  ichBotschaftStatements = lines;
}

async function loadIchBotschaftModeConfig() {
  const response = await fetch(`${ICH_BOTSCHAFT_MODE_CONFIG_FILE}?t=${Date.now()}`);
  if (!response.ok) {
    return;
  }

  const modeConfig = await response.json();
  if (modeConfig?.statementsFile && modeConfig?.feedbackPromptFile) {
    ichBotschaftModeConfig = modeConfig;
  }
}

function appendExerciseTaskMessage() {
  pendingIchMessageType = "task";
  const statement = ichBotschaftStatements[exerciseIndex];
  appendMessage(
    `Aussage ${exerciseIndex + 1}:\n"${statement}"\n\nFormuliere diese Aussage als Ich-Botschaft.`,
    "partner",
  );
}

function restartIchBotschaftExercise() {
  if (currentMode !== "ich-botschaft") return;

  exerciseIndex = 0;
  exerciseAwaitingRevision = false;
  chatWindow.innerHTML = "";
  setExerciseActionsVisible(false);
  appendExerciseTaskMessage();
  enableInput("Formuliere die Aussage als Ich-Botschaft...");
  updateStatus("idle", `${getIchBotschaftProgressText()} (neu gestartet)`);
}

function enableInput(placeholderText) {
  userInput.disabled = false;
  sendBtn.disabled = false;
  sendBtn.classList.remove("opacity-50", "cursor-not-allowed");
  userInput.classList.remove("bg-gray-100", "cursor-not-allowed");
  userInput.classList.add("bg-slate-50");
  userInput.placeholder = placeholderText;
}

async function switchToIchBotschaftMode() {
  try {
    await loadIchBotschaftModeConfig();
    await Promise.all([
      loadIchBotschaftStatements(),
      loadIchBotschaftFeedbackPrompt(),
    ]);
  } catch (error) {
    console.error(error);
    updateStatus("error", "Modus-Dateien für Ich-Botschaften fehlen oder sind ungültig");
    return;
  }

  currentMode = "ich-botschaft";
  exerciseIndex = 0;
  exerciseAwaitingRevision = false;
  chatHistory = [];
  chatWindow.innerHTML = "";
  briefingContent.classList.remove("hidden");
  briefingContent.textContent =
    "Du übst hier die Umformulierung von Du-Botschaften in Ich-Botschaften. Die KI gibt dir kurzes Feedback, danach kannst du überarbeiten oder zur nächsten Aussage gehen.";
  briefingContent.style.whiteSpace = "pre-wrap";
  setMainSubtitle("Ich-Botschaften: Formuliere jede Aussage konstruktiv um.");
  setModeBadge("ich-botschaft");
  setExerciseActionsVisible(false);
  setScenarioSelectionVisible(false);
  scenarioSelect.disabled = true;
  const feedbackBtn = document.getElementById("feedback-btn");
  if (feedbackBtn) {
    feedbackBtn.disabled = true;
    feedbackBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
  enableInput("Formuliere die Aussage als Ich-Botschaft...");
  appendExerciseTaskMessage();
  updateStatus("idle", getIchBotschaftProgressText());
}

function switchToRoleplayMode() {
  currentMode = "roleplay";
  setExerciseActionsVisible(false);
  setScenarioSelectionVisible(true);
  scenarioSelect.disabled = false;
  setMainSubtitle("Lies das Briefing und starte das Gespräch mit einer Nachricht.");
  setModeBadge("roleplay");
  scenarioSelect.dispatchEvent(new Event("change"));
  updateStatus("idle", "Gesprächstraining aktiv");
}

// =========================================================
// 2. Scenario & Dropdown Logic
// =========================================================

/**
 * Fills the dropdown and adds a disabled placeholder option.
 */
async function initScenarioDropdown() {
  // Clear existing options and add the disabled placeholder
  scenarioSelect.innerHTML =
    '<option value="" selected disabled>Wähle eine Übung...</option>';

  for (const fileName of scenarioFiles) {
    try {
      const response = await fetch(`scenarios/${fileName}?t=${Date.now()}`);
      const content = await response.text();

      // Extract the title from the ### META ### block
      const titleMatch = content.match(/title:\s*(.*)/);
      const title = titleMatch ? titleMatch[1].trim() : fileName;

      const option = document.createElement("option");
      option.value = fileName;
      option.textContent = title;
      scenarioSelect.appendChild(option);
    } catch (e) {
      console.error("Error loading scenario metadata:", fileName, e);
    }
  }
}

/**
 * Loads scenario details AND the corresponding prompt files
 */
scenarioSelect.addEventListener("change", async (event) => {
  const fileName = event.target.value;
  if (!fileName) return;
  updateStatus("loading", "Szenario wird geladen...");

  briefingContent.innerHTML = `
    <div class="flex items-center text-gray-500">
      <svg class="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Lade Szenario...</span>
    </div>
  `;

  briefingContent.classList.remove("hidden");
  chatWindow.innerHTML = "";
  chatHistory = [];

  try {
    const response = await fetch(`scenarios/${fileName}`);
    const text = await response.text();

    const parsedScenario = parseScenarioContent(text);
    const {
      systemPromptFile,
      partnerPromptFile,
      mentorPromptFile,
      roleLabel,
      instructionSection,
    } = parsedScenario;

    if (roleLabel) {
      // Use role label if explicitly defined in META
      currentConfig.roleName = roleLabel;
    } else {
      // Attempt to extract the role name automatically from the "Deine Aufgabe" section
      const taskSection =
        instructionSection.split(/Deine Aufgabe/i)[1] || instructionSection;

      // Search for "mit" followed by a German article and the role name
      // This is a common pattern in German task descriptions
      const roleRegex = /mit\s+(?:der|dem|einem|einer)\s+([A-ZÄÖÜ][a-zäöüß]+)/i;

      const autoRoleMatch = taskSection.match(roleRegex);

      if (autoRoleMatch) {
        currentConfig.roleName = autoRoleMatch[1].trim();
      } else {
        // Fallback: search generally for capitalized words following an article
        const fallbackRegex =
          /\b(?:ein|einen|eine|einem|einer)\s+([A-ZÄÖÜ][a-zäöüß]+)/;
        const fallbackMatch = taskSection.match(fallbackRegex);

        currentConfig.roleName = fallbackMatch
          ? fallbackMatch[1].trim()
          : "Teammitglied";
      }

      // Normalization: Convert dative plural forms back to nominative for the UI
      if (currentConfig.roleName.toLowerCase().startsWith("mitarbeitend")) {
        currentConfig.roleName = "Mitarbeiter";
      }
    }

    // Format the role name: Capitalize first letter, lowercase the rest
    currentConfig.roleName =
      currentConfig.roleName.charAt(0).toUpperCase() +
      currentConfig.roleName.slice(1).toLowerCase();

    console.log("Erkannte Rolle:", currentConfig.roleName);

    // --- FETCH ACTUAL PROMPT CONTENTS ---
    const [sys, part, ment] = await Promise.all([
      fetch(`prompts/system/${systemPromptFile}.txt?t=${Date.now()}`).then((r) =>
        r.text(),
      ),
      fetch(`prompts/partner/${partnerPromptFile}.txt?t=${Date.now()}`).then((r) =>
        r.text(),
      ),
      mentorPromptFile
        ? fetch(`prompts/mentor/${mentorPromptFile}.txt?t=${Date.now()}`).then((r) =>
            r.text(),
          )
        : Promise.resolve(""),
    ]);

    currentConfig.systemPrompt = sys;
    currentConfig.partnerPrompt = part;
    currentConfig.mentorPrompt = ment;

    // Render scenario instructions with simple bold formatting
    briefingContent.innerHTML = `<div class="p-2">${instructionSection.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>`;
    briefingContent.style.whiteSpace = "pre-wrap";

    // Prepare UI for the start of the simulation
    if (startInfo) startInfo.classList.remove("hidden");
    chevron.style.transform = "rotate(0deg)";

    // 1. Enable input elements
    userInput.disabled = false;
    sendBtn.disabled = false;

    // 2. Reset visual state (remove disabled styles)
    userInput.classList.remove("bg-gray-100", "cursor-not-allowed");
    userInput.classList.add("bg-slate-50");
    userInput.placeholder = `Deine Nachricht an die ${currentConfig.roleName}...`;

    sendBtn.classList.remove("opacity-50", "cursor-not-allowed");

    // 3. Move initial info box to the bottom of the chat
    if (startInfo) {
      chatWindow.appendChild(startInfo);
    }

    updateStatus("idle", "Gesprächstraining bereit");
  } catch (error) {
    briefingContent.innerHTML =
      '<p class="text-red-500 p-4">Fehler beim Laden der Übung.</p>';
    console.error(error);
    updateStatus("error", "Szenario- oder Prompt-Datei konnte nicht geladen werden");
  }
});

// =========================================================
// 3. Chat UI Logic (Avatars & Bubbles)
// =========================================================

/**
 * Appends a message bubble with an avatar and name.
 * @param {string} text - Message content.
 * @param {string} sender - 'user' or 'partner'.
 */
function appendMessage(text, sender) {
  const wrapper = document.createElement("div");
  const isIchMode = currentMode === "ich-botschaft";

  // Layout: Reverse for user (Avatar right), Normal for partner (Avatar left)
  wrapper.className =
    sender === "user"
      ? `flex flex-row-reverse items-start mb-6 ${isIchMode ? "gap-0" : "gap-3"} ml-auto max-w-[85%]`
      : `flex flex-row items-start mb-6 ${isIchMode ? "gap-0" : "gap-3"} mr-auto max-w-[85%]`;

  // Create Avatar Element
  const avatar = document.createElement("div");

  // Prüfen, ob es sich um eine weibliche Rolle handelt (Endung "-in")
  const isFemale =
    sender !== "user" && currentConfig.roleName.toLowerCase().endsWith("in");

  avatar.className = `flex items-center justify-center text-xs shadow-sm flex-shrink-0 mt-1 ${
    sender === "user"
      ? "w-8 h-8 rounded-full bg-blue-700 text-white border-2 border-blue-400"
      : isFemale
        ? "w-12 h-16 rounded-xl bg-white border-2 border-white overflow-hidden"
        : "w-8 h-8 rounded-full bg-gray-300 text-gray-600 border-2 border-white"
  }`;
  if (!isIchMode) {
    if (sender === "user") {
      avatar.textContent = "DU";
    } else if (isFemale) {
      const avatarImg = document.createElement("img");
      avatarImg.src = "grafik.png";
      avatarImg.alt = currentConfig.roleName;
      avatarImg.className = "w-full h-full object-cover";
      avatar.appendChild(avatarImg);
    } else {
      // Zeige die ersten zwei Buchstaben für männliche oder neutrale Rollen (z.B. "MI" für Mitarbeiter)
      avatar.textContent = currentConfig.roleName.substring(0, 2).toUpperCase();
    }
  }

  // Create Content Container
  const contentDiv = document.createElement("div");
  contentDiv.className =
    sender === "user" ? "flex flex-col items-end" : "flex flex-col items-start";

  // Add name label above the bubble
  const nameLabel = document.createElement("span");
  nameLabel.className = "text-xs text-gray-500 mb-1 px-1";
  if (isIchMode) {
    nameLabel.textContent = sender === "user" ? "Deine Antwort" : "Trainer";
  } else {
    nameLabel.textContent =
      sender === "user" ? "Du (Führungskraft)" : currentConfig.roleName;
  }

  // Create Message Bubble
  const msgBubble = document.createElement("div");
  if (sender === "user") {
    msgBubble.className =
      "bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-md";
  } else if (currentMode === "ich-botschaft" && pendingIchMessageType === "task") {
    msgBubble.className =
      "bg-sky-50 text-sky-900 p-3 rounded-2xl rounded-tl-none shadow-md border border-sky-200";
    nameLabel.textContent = "Aufgabe";
  } else if (
    sender !== "user" &&
    currentMode === "ich-botschaft" &&
    pendingIchMessageType === "feedback"
  ) {
    msgBubble.className =
      "bg-violet-50 text-violet-900 p-3 rounded-2xl rounded-tl-none shadow-md border border-violet-200";
    nameLabel.textContent = "Feedback";
  } else {
    msgBubble.className =
      "bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none shadow-md border border-gray-100";
  }
  appendTextWithLineBreaks(msgBubble, text);

  contentDiv.appendChild(nameLabel);
  contentDiv.appendChild(msgBubble);
  if (!isIchMode) {
    wrapper.appendChild(avatar);
  }
  wrapper.appendChild(contentDiv);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  pendingIchMessageType = null;
}

/**
 * Handles message input and simulated response.
 */
async function handleSend() {
  if (currentMode === "ich-botschaft") {
    await handleIchBotschaftSend();
    return;
  }

  const message = userInput.value.trim();
  // Check if a scenario is loaded and input is not empty
  if (!message || !currentConfig.systemPrompt) return;

  if (!briefingContent.classList.contains("hidden")) {
    briefingContent.classList.add("hidden");
    chevron.style.transform = "rotate(90deg)";
  }

  sendBtn.disabled = true;
  userInput.disabled = true;
  sendBtn.classList.add("opacity-50", "cursor-not-allowed");
  userInput.classList.add("bg-gray-100");

  // 1. UI: Show user message and clear input
  if (startInfo) startInfo.classList.add("hidden");
  appendMessage(message, "user");
  updateStatus("loading", `${currentConfig.roleName} antwortet...`);
  userInput.value = "";

  // 2. UI: Show typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.className =
    "self-start text-xs text-gray-400 italic mb-4 animate-pulse";
  typingIndicator.textContent = `${currentConfig.roleName} schreibt...`;
  chatWindow.appendChild(typingIndicator);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // 3. Initialize chat history with system/role prompts on first message
  if (chatHistory.length === 0) {
    // Combine both prompts into one single system instruction
    const combinedSystemInstructions = `${currentConfig.systemPrompt}\n\n${currentConfig.partnerPrompt}`;

    chatHistory.push({
      role: "system",
      content: combinedSystemInstructions,
    });
  }

  chatHistory.push({ role: "user", content: message });

  try {
    // 4. API Call via proxy
    const data = await callChatApi(chatHistory, CHAT_TEMPERATURE);

    if (chatWindow.contains(typingIndicator)) {
      chatWindow.removeChild(typingIndicator);
    }

    // 5. Extract the answer and display it
    if (data.choices && data.choices[0]) {
      const botResponse = data.choices[0].message.content;
      chatHistory.push({ role: "assistant", content: botResponse });
      appendMessage(botResponse, "partner");
    } else {
      throw new Error("Unexpected API response format");
    }

    const feedbackBtn = document.getElementById("feedback-btn");
    if (feedbackBtn) {
      feedbackBtn.disabled = false;
      feedbackBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }

    document.getElementById("feedback-area")?.classList.remove("hidden");

    updateStatus("idle", "Gesprächstraining aktiv");
  } catch (error) {
    updateStatus("error", "Verbindung unterbrochen");
    console.error("Error during API call:", error);
    if (chatWindow.contains(typingIndicator)) {
      chatWindow.removeChild(typingIndicator);
    }
    appendMessage("Verbindung fehlgeschlagen.", "partner");
  } finally {
    // Always re-enable UI
    sendBtn.disabled = false;
    userInput.disabled = false;
    sendBtn.classList.remove("opacity-50", "cursor-not-allowed");
    userInput.classList.remove("bg-gray-100");

    const resetBtn = document.getElementById("reset-btn");
    resetBtn.disabled = false;
    resetBtn.classList.remove("opacity-50", "cursor-not-allowed");

    // Set focus back to input so the user can keep typing immediately
    userInput.focus();
  }
}

async function handleIchBotschaftSend() {
  const userAnswer = userInput.value.trim();
  if (!userAnswer) return;

  appendMessage(userAnswer, "user");
  userInput.value = "";
  enableInput("Feedback wird erstellt...");
  userInput.disabled = true;
  sendBtn.disabled = true;
  sendBtn.classList.add("opacity-50", "cursor-not-allowed");
  updateStatus("loading", "Trainer gibt Feedback...");

  const statement = ichBotschaftStatements[exerciseIndex];
  const messages = [
    { role: "system", content: ichBotschaftFeedbackPrompt },
    {
      role: "user",
      content: `Du-Botschaft:\n${statement}\n\nAntwort der Nutzer*in:\n${userAnswer}`,
    },
  ];

  try {
    const data = await callChatApi(messages, ICH_BOTSCHAFT_TEMPERATURE);
    if (!data.choices || !data.choices[0]) {
      throw new Error("Unexpected API response format");
    }

    pendingIchMessageType = "feedback";
    appendMessage(data.choices[0].message.content, "partner");
    setExerciseActionsVisible(true);
    exerciseAwaitingRevision = true;
    updateStatus("idle", `${getIchBotschaftProgressText()} - Feedback bereit`);
  } catch (error) {
    console.error("Ich-Botschaft Feedback Fehler:", error);
    appendMessage("Feedback konnte nicht geladen werden. Bitte erneut versuchen.", "partner");
    updateStatus("error", "Feedback fehlgeschlagen (Proxy oder API nicht erreichbar)");
  } finally {
    enableInput("Überarbeite deine Antwort oder gehe zur nächsten Aussage.");
  }
}

async function handleFeedback() {
  if (chatHistory.length === 0) return;

  const overlay = document.getElementById("loading-overlay");
  const feedbackBtn = document.getElementById("feedback-btn");

  updateStatus("loading", "Mentor analysiert...");

  // 1. Lock UI and show processing overlay
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent scrolling in the background
  feedbackBtn.disabled = true;

  // 2. Create the conversation transcript for the mentor
  const transcript = chatHistory
    .filter((m) => m.role !== "system")
    .map((m) => {
      const name = m.role === "user" ? "Führungskraft" : currentConfig.roleName;
      return `${name}: ${m.content}`;
    })
    .join("\n\n");

  // 3. Prepare messages for the AI Mentor
  const mentorMessages = [
    { role: "system", content: currentConfig.mentorPrompt },
    {
      role: "user",
      content: `Hier ist das Gesprächsprotokoll zur Analyse:\n\n${transcript}`,
    },
  ];

  try {
    const data = await callChatApi(mentorMessages, MENTOR_TEMPERATURE); // Low temperature for more analytical results

    if (data.choices && data.choices[0]) {
      const feedbackContent = data.choices[0].message.content;
      showFeedbackModal(feedbackContent, transcript);
    }

    updateStatus("idle", "Mentor-Analyse abgeschlossen");
  } catch (error) {
    updateStatus("error", "Mentor-Analyse fehlgeschlagen (Proxy oder API nicht erreichbar)");
    console.error("Feedback Fehler:", error);
    document.body.style.overflow = "auto";
  } finally {
    overlay.classList.add("hidden");
    feedbackBtn.disabled = false;
  }
}

function showFeedbackModal(feedback, transcript) {
  const modal = document.getElementById("feedback-modal");
  const container = document.getElementById("feedback-text");

  renderBoldMarkdownWithLineBreaks(container, feedback);

  modal.classList.remove("hidden");

  // Download functionality
  document.getElementById("download-btn").onclick = () => {
    const exportText = `GESPRÄCHSPROTOKOLL\n====================\n\n${transcript}\n\nMENTOR FEEDBACK\n====================\n\n${feedback}`;
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Feedback_Gespraechstraining.txt`;
    a.click();
  };
}

// Function to close the feedback modal
function closeFeedbackModal() {
  document.getElementById("feedback-modal").classList.add("hidden");
  document.body.style.overflow = "auto"; // Re-enable background scrolling
}

// === RESET MODAL LOGIC ===
function openResetModal() {
  const modal = document.getElementById("reset-modal");
  if (!modal) return;

  modal.classList.remove("hidden");
  // Animation: Brief delay to ensure scaling transition works after removing 'hidden'
  const content = modal.querySelector("div");
  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
}

function closeResetModal() {
  const modal = document.getElementById("reset-modal");
  const content = modal.querySelector("div");

  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

// Single event listener for the reset button
document.getElementById("reset-btn").addEventListener("click", openResetModal);

/**
 * Updates the sidebar status indicator.
 * @param {string} type - 'idle', 'loading', or 'error'.
 * @param {string} message - The text to display.
 */
function updateStatus(type, message) {
  if (!statusBox) return;

  // Base classes for the box
  let classes =
    "status-box p-3 rounded-xl border text-xs font-medium transition-all duration-300 flex items-center gap-2 ";

  // Dot element (using an inline SVG for a clean look)
  let dot = `<span class="relative flex h-2 w-2">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
               <span class="relative inline-flex rounded-full h-2 w-2"></span>
             </span>`;

  if (type === "loading") {
    classes += "bg-blue-50 text-blue-700 border-blue-200";
    dot = dot.replace("rounded-full", "rounded-full bg-blue-500");
  } else if (type === "error") {
    classes += "bg-red-50 text-red-700 border-red-200";
    dot = dot
      .replace("animate-ping", "")
      .replace("rounded-full", "rounded-full bg-red-500");
    dot = `<span class="h-2 w-2 rounded-full bg-red-500"></span>`; // No pulse on error
  } else {
    // Idle / Ready state
    classes += "bg-slate-50 text-slate-600 border-slate-200";
    dot = `<span class="h-2 w-2 rounded-full bg-green-500"></span>`;
  }

  statusBox.className = classes;
  statusBox.innerHTML = `${dot} <span>${message}</span>`;
}

// =========================================================
// 4. Execution & Listeners
// =========================================================
async function startApp() {
  await loadScenarioIndex();
  await initScenarioDropdown(); // Dropdown füllen

  // Falls Szenarien vorhanden sind, das erste sofort laden
  if (scenarioFiles.length > 0) {
    scenarioSelect.value = scenarioFiles[0];
    scenarioSelect.dispatchEvent(new Event("change")); // Triggert den Ladevorgang
  }
}

// Event Listener für Eingaben
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

modeSelect?.addEventListener("change", (event) => {
  if (event.target.value === "ich-botschaft") {
    switchToIchBotschaftMode();
    return;
  }
  switchToRoleplayMode();
});

reviseBtn?.addEventListener("click", () => {
  if (!exerciseAwaitingRevision) return;
  userInput.focus();
  updateStatus("idle", "Überarbeite deine Antwort");
});

nextExerciseBtn?.addEventListener("click", () => {
  if (currentMode !== "ich-botschaft") return;

  if (exerciseIndex >= ichBotschaftStatements.length - 1) {
    appendMessage(
      "Sehr gut! Du hast alle Aussagen bearbeitet. Wenn du möchtest, kannst du den Modus wechseln oder die Übung neu starten.",
      "partner",
    );
    setExerciseActionsVisible(false);
    updateStatus("idle", "Ich-Botschaften abgeschlossen");
    return;
  }

  exerciseIndex += 1;
  exerciseAwaitingRevision = false;
  setExerciseActionsVisible(false);
  appendExerciseTaskMessage();
  enableInput("Formuliere die Aussage als Ich-Botschaft...");
  updateStatus("idle", getIchBotschaftProgressText());
});

restartExerciseBtn?.addEventListener("click", restartIchBotschaftExercise);

// Logik für das Auf-/Zuklappen des Briefings
briefingHeader.addEventListener("click", () => {
  const isHidden = briefingContent.classList.toggle("hidden");
  chevron.style.transform = isHidden ? "rotate(90deg)" : "rotate(0deg)";
});

// =========================================================
// 5. Mobile Menu Logic
// =========================================================
function toggleMobileMenu() {
  const isClosed = sidebar.classList.contains("-translate-x-full");

  if (isClosed) {
    // Open menu
    sidebar.classList.remove("-translate-x-full");
    sidebarOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scroll
  } else {
    // Close menu
    sidebar.classList.add("-translate-x-full");
    sidebarOverlay.classList.add("hidden");
    document.body.style.overflow = ""; // Restore scroll
  }
}

mobileMenuBtn?.addEventListener("click", toggleMobileMenu);
sidebarOverlay?.addEventListener("click", toggleMobileMenu);

// Schließe das Menü automatisch, wenn ein Szenario gewählt wurde (auf Mobile)
scenarioSelect.addEventListener("change", () => {
  if (window.innerWidth < 1024) {
    toggleMobileMenu();
  }
});

function updateSubtitleText() {
  const mainSubtitle = document.getElementById("main-subtitle");
  if (!mainSubtitle) return;

  const baseText =
    "Lies das Briefing und starte das Gespräch mit einer Nachricht.";

  if (window.innerWidth < 1024) {
    // Wir fügen mobil nur die Info hinzu, wie man wechselt
    mainSubtitle.innerHTML = `${baseText} <br><span class="text-xs text-blue-600">Szenario wechseln? Klicke oben rechts auf ☰</span>`;
  } else {
    mainSubtitle.textContent = baseText;
  }
}

// Execute when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Untertitel je nach Gerät anpassen
  updateSubtitleText();

  // Die App zentral starten
  startApp();
});

// Briefing auf Mobilgeräten einklappen, sobald das Textfeld fokussiert wird
userInput.addEventListener("focus", () => {
  if (window.innerWidth < 1024) {
    // 1024px ist der Tailwind-Breakpoint für 'lg'
    if (!briefingContent.classList.contains("hidden")) {
      briefingContent.classList.add("hidden");
      chevron.style.transform = "rotate(90deg)";
    }
  }
});

// Update text dynamically if window is resized
window.addEventListener("resize", updateSubtitleText);
