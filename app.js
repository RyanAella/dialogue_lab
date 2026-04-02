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

// Store the loaded prompt contents here
let currentConfig = {
  systemPrompt: "",
  partnerPrompt: "",
  mentorPrompt: "",
  roleName: "Teammitglied", // Standard Name
};

let chatHistory = [];

// List of scenario files to be loaded into the dropdown
const scenarioFiles = ["reporting_scenario.txt", "difficulties_scenario.txt"];

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

    // Split the file content at the GUI INSTRUCTION marker
    const parts = text.split(/###\s*GUI INSTRUCTION\s*###/);
    const metaSection = parts[0];
    const instructionSection = parts[1] ? parts[1].trim() : "";

    // --- EXTRACT FILENAMES FROM META ---
    const systemFile = metaSection.match(/system_prompt:\s*(.*)/)?.[1].trim();
    const partnerFile = metaSection.match(/partner_prompt:\s*(.*)/)?.[1].trim();
    const mentorFile = metaSection.match(/mentor_prompt:\s*(.*)/)?.[1].trim();

    const roleMatchMeta = metaSection.match(/role_label:\s*(.*)/);

    if (roleMatchMeta) {
      // Use role label if explicitly defined in META
      currentConfig.roleName = roleMatchMeta[1].trim();
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
      fetch(`prompts/system/${systemFile}.txt?t=${Date.now()}`).then((r) =>
        r.text(),
      ),
      fetch(`prompts/partner/${partnerFile}.txt?t=${Date.now()}`).then((r) =>
        r.text(),
      ),
      mentorFile
        ? fetch(`prompts/mentor/${mentorFile}.txt?t=${Date.now()}`).then((r) =>
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

    updateStatus("idle", "Übung aktiv");
  } catch (error) {
    briefingContent.innerHTML =
      '<p class="text-red-500 p-4">Fehler beim Laden der Übung.</p>';
    console.error(error);
    updateStatus("error", "Ladefehler");
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

  // Layout: Reverse for user (Avatar right), Normal for partner (Avatar left)
  wrapper.className =
    sender === "user"
      ? "flex flex-row-reverse items-start mb-6 gap-3 ml-auto max-w-[85%]"
      : "flex flex-row items-start mb-6 gap-3 mr-auto max-w-[85%]";

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
  if (sender === "user") {
    avatar.innerHTML = "DU";
  } else if (isFemale) {
    avatar.innerHTML = `<img src="grafik.png" alt="${currentConfig.roleName}" class="w-full h-full object-cover">`;
  } else {
    // Zeige die ersten zwei Buchstaben für männliche oder neutrale Rollen (z.B. "MI" für Mitarbeiter)
    avatar.innerHTML = currentConfig.roleName.substring(0, 2).toUpperCase();
  }

  // Create Content Container
  const contentDiv = document.createElement("div");
  contentDiv.className =
    sender === "user" ? "flex flex-col items-end" : "flex flex-col items-start";

  // Add name label above the bubble
  const nameLabel = document.createElement("span");
  nameLabel.className = "text-xs text-gray-500 mb-1 px-1";
  nameLabel.textContent =
    sender === "user" ? "Du (Führungskraft)" : currentConfig.roleName;

  // Create Message Bubble
  const msgBubble = document.createElement("div");
  msgBubble.className =
    sender === "user"
      ? "bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-md"
      : "bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none shadow-md border border-gray-100";
  msgBubble.innerHTML = text.replace(/\n/g, "<br>");

  contentDiv.appendChild(nameLabel);
  contentDiv.appendChild(msgBubble);
  wrapper.appendChild(avatar);
  wrapper.appendChild(contentDiv);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Handles message input and simulated response.
 */
async function handleSend() {
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
    const response = await fetch("https://kite2.site/chat.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatHistory,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

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

    updateStatus("idle", "Übung aktiv");
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
    const response = await fetch("https://kite2.site/chat.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: mentorMessages,
        temperature: 0.3, // Low temperature for more analytical results
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const feedbackContent = data.choices[0].message.content;
      showFeedbackModal(feedbackContent, transcript);
    }

    updateStatus("idle", "Analyse abgeschlossen");
  } catch (error) {
    updateStatus("error", "Analyse fehlgeschlagen");
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

  // Basic markdown bold formatting
  container.innerHTML = feedback.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>",
  );

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
