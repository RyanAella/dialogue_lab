/**
 * UI Manager - Responsible for DOM elements and visual updates
 */

export const UI = {
  /** Mapping of relevant DOM elements */
  elements: {
    briefingHeader: document.getElementById("briefing-header"),
    briefingContent: document.getElementById("briefing-content"),
    chevron: document.getElementById("chevron"),
    exerciseSelect: document.getElementById("exercises"), // Renamed from scenarios
    chatWindow: document.getElementById("chat-window"),
    userInput: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    statusBox: document.getElementById("status-box"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    exerciseActions: document.getElementById("exercise-actions"),
    restartExerciseBtn: document.getElementById("restart-exercise-btn"),
    reviseBtn: document.getElementById("revise-btn"),
    nextExerciseBtn: document.getElementById("next-exercise-btn"),
  },

  /**
   * Updates the system status box with different visual states.
   * @param {'loading'|'error'|'idle'} type - The status type.
   * @param {string} message - The message to display.
   */
  updateStatus(type, message) {
    const { statusBox } = this.elements;
    if (!statusBox) return;
    let classes =
      "status-box p-3 rounded-xl border text-xs font-medium transition-all duration-300 flex items-center gap-2 ";
    let dot = `<span class="relative flex h-2 w-2">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-2 w-2"></span>
               </span>`;

    if (type === "loading") {
      classes += "bg-blue-50 text-blue-700 border-blue-200";
      dot = dot.replace("rounded-full", "rounded-full bg-blue-500");
    } else if (type === "error") {
      classes += "bg-red-50 text-red-700 border-red-200";
      dot = `<span class="h-2 w-2 rounded-full bg-red-500"></span>`;
    } else {
      classes += "bg-slate-50 text-slate-600 border-slate-200";
      dot = `<span class="h-2 w-2 rounded-full bg-green-500"></span>`;
    }
    statusBox.className = classes;
    statusBox.innerHTML = `${dot} <span>${message}</span>`;
  },

  /**
   * Appends a message bubble to the chat window.
   * @param {string} text - The message content.
   * @param {'user'|'partner'} sender - Who sent the message.
   * @param {Object} options - Additional configuration.
   * @param {'default'|'task'|'feedback'} [options.messageType='default'] - Visual style for the message.
   * @param {string} [options.roleName='Partner'] - Name to display for the partner.
   * @param {boolean} [options.isIchMode=false] - Whether the app is in exercise/transformation mode.
   * @param {boolean} [options.shouldScroll=true] - Whether to scroll to the bottom after appending.
   */
  appendMessage(text, sender, options = {}) {
    const { chatWindow } = this.elements;
    const {
      messageType = "default",
      isIchMode = false,
      shouldScroll = true,
    } = options;

    const wrapper = document.createElement("div");

    const contentDiv = document.createElement("div");
    contentDiv.className =
      sender === "user"
        ? "flex flex-col items-end"
        : "flex flex-col items-start";

    let label = sender === "user" ? "Deine Antwort" : "Partner";
    let bubbleClass =
      sender === "user"
        ? "bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-md"
        : "bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none shadow-md border border-gray-100";

    if (isIchMode && sender !== "user") {
      if (messageType === "task") {
        label = "Aufgabe";
        bubbleClass =
          "bg-sky-50 text-sky-900 p-3 rounded-2xl rounded-tl-none shadow-md border border-sky-200";
      } else if (messageType === "feedback") {
        label = "Feedback";
        bubbleClass =
          "bg-violet-50 text-violet-900 p-3 rounded-2xl rounded-tl-none shadow-md border border-violet-200";
      }
    }

    wrapper.className =
      sender === "user"
        ? `flex flex-row-reverse items-start mb-6 ${isIchMode ? "gap-0" : "gap-3"} ml-auto max-w-[92%] md:max-w-[85%]`
        : `flex flex-row items-start mb-6 ${isIchMode ? "gap-0" : "gap-3"} mr-auto max-w-[92%] md:max-w-[85%]`;

    const nameLabel = document.createElement("span");
    nameLabel.className = "text-xs text-gray-500 mb-1 px-1";
    nameLabel.textContent = label;

    const msgBubble = document.createElement("div");
    msgBubble.className = bubbleClass;
    msgBubble.style.whiteSpace = "pre-wrap";
    msgBubble.textContent = text;

    contentDiv.appendChild(nameLabel);
    contentDiv.appendChild(msgBubble);
    wrapper.appendChild(contentDiv);
    chatWindow.appendChild(wrapper);

    if (shouldScroll) {
      requestAnimationFrame(() => {
        const main = chatWindow.closest("main");
        if (main) main.scrollTop = main.scrollHeight;
      });
    }
  },

  /**
   * Toggles the visibility of exercise action buttons (Revise, Next, Restart).
   * @param {boolean} visible
   */
  setExerciseActionsVisible(visible) {
    this.elements.exerciseActions?.classList.toggle("hidden", !visible);
  },

  /**
   * Updates the user input field and send button state.
   * @param {boolean} disabled - Whether interaction is blocked.
   * @param {string} placeholder - The text to show in the empty input field.
   */
  updateInputUI(disabled, placeholder) {
    const { userInput, sendBtn } = this.elements;
    userInput.disabled = disabled;
    sendBtn.disabled = disabled;
    userInput.placeholder = placeholder;
    userInput.classList.toggle("bg-gray-100", disabled);
    userInput.classList.toggle("cursor-not-allowed", disabled);
    sendBtn.classList.toggle("opacity-50", disabled);
    sendBtn.classList.toggle("cursor-not-allowed", disabled);
    if (!disabled) userInput.classList.add("bg-slate-50");
  },

  /**
   * Shows a loading spinner inside the briefing area.
   * @param {boolean} isLoading
   */
  setBriefingLoading(isLoading) {
    if (!isLoading) return;
    this.elements.briefingContent.innerHTML = `
      <div class="flex items-center text-gray-500">
        <svg class="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Lade Übung...</span>
      </div>
    `;
    this.elements.briefingContent.classList.remove("hidden");
  },

  /**
   * Controls the expanded/collapsed state of the briefing section.
   * @param {boolean} expanded
   */
  setBriefingExpanded(expanded) {
    const { briefingContent, chevron } = this.elements;
    briefingContent.classList.toggle("hidden", !expanded);
    if (chevron)
      chevron.style.transform = expanded ? "rotate(0deg)" : "rotate(90deg)";
  },

  /**
   * Handles the opening and closing of the mobile sidebar.
   * @param {boolean} [forceClose=false] - If true, ensures the sidebar is closed.
   */
  toggleMobileMenu(forceClose = false) {
    const { sidebar, sidebarOverlay } = this.elements;
    const isOpen = !sidebar.classList.contains("-translate-x-full");
    if (forceClose || isOpen) {
      sidebar.classList.add("-translate-x-full");
      sidebarOverlay.classList.add("hidden");
      document.body.style.overflow = "";
    } else {
      sidebar.classList.remove("-translate-x-full");
      sidebarOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  },
};

/**
 * Updates the subtitle text based on screen width for responsive messaging.
 */
export const updateSubtitleText = () => {
  const sub = document.getElementById("main-subtitle");
  if (!sub) return;
  const base = "Wähle eine Übung aus, um zu starten.";
  sub.innerHTML =
    window.innerWidth < 1024
      ? `${base} <br><span class="text-xs text-blue-600">Übung wechseln? Klicke oben rechts auf ☰</span>`
      : base;
};
