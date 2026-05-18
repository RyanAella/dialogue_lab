import { Utils } from "./utils.js";

// Constants for Voice Selection
const VOICE_KEYWORDS = {
  female: [
    "katja",
    "maren",
    "anna",
    "zira",
    "hedda",
    "clara",
    "julia",
    "sabrina",
    "monika",
    "verena",
    "elke",
  ],
  male: [
    "stefan",
    "conrad",
    "kasper",
    "killian",
    "hans",
    "gustav",
    "florian",
    "michael",
    "markus",
    "peter",
  ],
  highQuality: ["neural", "natural", "online", "premium", "enhanced"],
};

export const UI = {
  /** Centralized storage for DOM elements */
  elements: {},

  /**
   * Automatically binds DOM elements to the UI.elements object based on ID mapping.
   * Converts kebab-case IDs to camelCase properties.
   */
  _bindElements() {
    const ids = [
      "briefing-header",
      "briefing-content",
      "chevron",
      "scenarios",
      "exercises",
      "scenario-section",
      "exercise-section",
      "mode-select",
      "mode-badge",
      "chat-window",
      "start-info",
      "user-input",
      "send-btn",
      "status-box",
      "mobile-menu-btn",
      "sidebar",
      "sidebar-overlay",
      "exercise-actions",
      "download-btn",
      "feedback-btn",
      "export-transcript-btn",
      "modal-download-btn",
      "reset-btn",
      "auto-speak-toggle",
      "speak-briefing-btn",
      "stop-speech-btn",
      "mic-btn",
      "loading-overlay",
      "feedback-modal",
      "reset-modal",
    ];
    ids.forEach((id) => {
      const camelCaseId = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      this.elements[camelCaseId] = document.getElementById(id);
    });
    // Remap specific non-standard IDs
    this.elements.scenarioSelect = this.elements.scenarios;
    this.elements.exerciseSelect = this.elements.exercises;
  },

  updateSidebarVisibility(mode) {
    const isTransformation = mode === "transformation";
    this.elements.scenarioSection?.classList.toggle("hidden", isTransformation);
    this.elements.exerciseSection?.classList.toggle(
      "hidden",
      !isTransformation,
    );
  },

  updateStatus(type, message) {
    const { statusBox } = this.elements;
    if (!statusBox) return;

    const configs = {
      loading: {
        cls: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500 animate-ping",
      },
      error: {
        cls: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      },
      default: {
        cls: "bg-slate-50 text-slate-600 border-slate-200",
        dot: "bg-green-500",
      },
    };

    const config = configs[type] || configs.default;
    const baseCls =
      "status-box p-3 rounded-xl border text-xs font-medium transition-all duration-300 flex items-center gap-2";

    statusBox.className = `${baseCls} ${config.cls}`;
    statusBox.innerHTML = `<span class="h-2 w-2 rounded-full ${config.dot}"></span>`;

    const textSpan = document.createElement("span");
    textSpan.textContent = message;
    statusBox.appendChild(textSpan);
  },

  /**
   * Orchestrates the creation and addition of a message to the chat
   */
  appendMessage(text, sender, options = {}) {
    const { chatWindow } = this.elements;
    const { isIchMode = false, shouldScroll = true } = options;

    const wrapper = document.createElement("div");
    wrapper.className = `flex items-start mb-6 gap-3 max-w-[92%] md:max-w-[85%] ${
      sender === "user" ? "flex-row-reverse ml-auto" : "flex-row mr-auto"
    }`;

    if (!isIchMode) wrapper.appendChild(this._createAvatar(sender, options));
    wrapper.appendChild(this._createMessageBody(text, sender, options));

    chatWindow.appendChild(wrapper);

    if (shouldScroll) {
      requestAnimationFrame(() => {
        const main = chatWindow.closest("main");
        if (main) main.scrollTop = main.scrollHeight;
      });
    }
  },

  /**
   * Displays a typing indicator bubble in the chat
   */
  showTypingIndicator(roleName) {
    this.hideTypingIndicator(); // Ensure no duplicates
    const wrapper = document.createElement("div");
    wrapper.id = "typing-indicator";
    wrapper.className =
      "flex items-start mb-6 gap-3 flex-row mr-auto max-w-[92%]";

    wrapper.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 mt-1"></div>
      <div class="flex flex-col">
        <div class="text-xs text-gray-500 mb-1">${roleName} schreibt...</div>
        <div class="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>
    `;
    this.elements.chatWindow.appendChild(wrapper);
    this.elements.chatWindow
      .closest("main")
      ?.scrollTo(0, this.elements.chatWindow.scrollHeight);
  },

  hideTypingIndicator() {
    document.getElementById("typing-indicator")?.remove();
  },

  /**
   * Internal helper to create the avatar element
   */
  _createAvatar(sender, { roleName = "Partner" }) {
    const avatar = document.createElement("div");
    const isFemale = sender !== "user" && roleName.toLowerCase().endsWith("in");

    avatar.className = `flex items-center justify-center text-xs shadow-sm flex-shrink-0 mt-1 ${
      sender === "user"
        ? "w-8 h-8 rounded-full bg-blue-700 text-white border-2 border-blue-400"
        : isFemale
          ? "w-12 h-16 rounded-xl bg-white border-2 border-white overflow-hidden"
          : "w-8 h-8 rounded-full bg-gray-300 text-gray-600 border-2 border-white"
    }`;

    if (sender === "user") {
      avatar.textContent = "DU";
    } else if (isFemale) {
      const img = document.createElement("img");
      img.src = "src/assets/grafik.png";
      img.className = "w-full h-full object-cover";
      avatar.appendChild(img);
    } else {
      avatar.textContent = roleName.substring(0, 2).toUpperCase();
    }
    return avatar;
  },

  /**
   * Internal helper to create the message content (label + bubble)
   */
  _createMessageBody(
    text,
    sender,
    { messageType = "default", roleName = "Partner", isIchMode = false },
  ) {
    const container = document.createElement("div");
    container.className =
      sender === "user"
        ? "flex flex-col items-end w-full"
        : "flex flex-col items-start w-full";

    const styleMap = {
      user: {
        label: "Deine Antwort",
        cls: "bg-blue-600 text-white rounded-tr-none",
      },
      partner: {
        label: roleName,
        cls: "bg-white text-slate-800 border-slate-100 rounded-tl-none",
      },
      task: {
        label: roleName,
        cls: "bg-sky-50 text-sky-900 border-sky-100 rounded-tl-none",
      },
      feedback: {
        label: roleName,
        cls: "bg-indigo-50 text-indigo-900 border-indigo-100 rounded-tl-none",
      },
    };

    const styleKey = isIchMode && sender !== "user" ? messageType : sender;
    const config = styleMap[styleKey] || styleMap.partner;

    // Create Label with Speech Button
    const nameLabel = document.createElement("div");
    nameLabel.className =
      "text-xs text-gray-500 mb-1 px-1 flex items-center gap-1.5";
    nameLabel.textContent = config.label;

    const speakBtn = document.createElement("button");
    speakBtn.className =
      "hover:text-blue-600 transition-colors opacity-60 hover:opacity-100 p-0.5";
    speakBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414-1.414 5 5 0 000-7.072 1 1 0 011.414-1.414 7 7 0 010 9.9z" clip-rule="evenodd" /></svg>`;
    speakBtn.onclick = () => this.speak(text, config.label, speakBtn);
    nameLabel.appendChild(speakBtn);

    // Create Bubble
    const msgBubble = document.createElement("div");
    msgBubble.className = `p-4 rounded-2xl shadow-sm border ${config.cls}`;
    msgBubble.style.whiteSpace = "pre-wrap";
    msgBubble.textContent = text;

    container.appendChild(nameLabel);
    container.appendChild(msgBubble);
    return container;
  },

  setExerciseActionsVisible(visible) {
    this.elements.exerciseActions?.classList.toggle("hidden", !visible);
  },

  /**
   * Handles all UI transitions when a user starts an interaction
   */
  prepareForInteraction() {
    const { briefingContent, chevron, startInfo } = this.elements;

    // Collapse briefing and hide initial info
    if (briefingContent) briefingContent.classList.add("hidden");
    if (chevron) chevron.style.transform = "rotate(90deg)";
    if (startInfo) startInfo.classList.add("hidden");
  },

  setModeBadge(mode) {
    const { modeBadge } = this.elements;
    if (!modeBadge) return;
    if (mode === "transformation") {
      modeBadge.textContent = "Modus: Übungen";
      modeBadge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200";
    } else {
      modeBadge.textContent = "Modus: Simulationen";
      modeBadge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200";
    }
  },

  updateInputUI(disabled, placeholder) {
    const { userInput, sendBtn, micBtn } = this.elements;
    const micDisabled = disabled || !this._voiceSupported;

    userInput.disabled = disabled;
    sendBtn.disabled = disabled;
    if (micBtn) micBtn.disabled = micDisabled;
    userInput.placeholder = placeholder;
    userInput.classList.toggle("bg-gray-100", disabled);
    userInput.classList.toggle("cursor-not-allowed", disabled);
    sendBtn.classList.toggle("opacity-50", disabled);
    sendBtn.classList.toggle("cursor-not-allowed", disabled);

    if (micBtn) {
      micBtn.classList.toggle("opacity-50", micDisabled);
      micBtn.classList.toggle("cursor-not-allowed", micDisabled);
    }
    if (!disabled) userInput.classList.add("bg-slate-50");
  },

  init() {
    // Bind all DOM elements to UI.elements before setting up logic
    this._bindElements();

    if (this.elements.speakBriefingBtn) {
      this.elements.speakBriefingBtn.onclick = (e) => {
        e.stopPropagation();
        this.speak(
          this.elements.briefingContent.innerText, // Briefing content
          "Briefing",
          e.currentTarget,
        );
      };
    }

    // Stop button in the sidebar
    if (this.elements.stopSpeechBtn) {
      this.elements.stopSpeechBtn.onclick = () => {
        window.speechSynthesis.cancel();
        if (this.elements.autoSpeakToggle) {
          this.elements.autoSpeakToggle.checked = false;
          // Trigger event so that app.js sets STATE.ttsEnabled to false
          this.elements.autoSpeakToggle.dispatchEvent(new Event("change"));
        }
      };
    }

    this.initVoiceInput();
  },

  initVoiceInput() {
    const { micBtn, userInput } = this.elements;
    if (!micBtn) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this._voiceSupported = !!SpeechRecognition;

    if (!SpeechRecognition) {
      micBtn.title =
        "Spracherkennung wird von Firefox leider nicht unterstützt. Bitte nutze Chrome oder Edge.";
      micBtn.classList.add("cursor-help");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;

    recognition.onstart = () => {
      this._isListening = true;
      micBtn.classList.add("text-red-600", "animate-pulse"); // Visual feedback for listening
      this.updateStatus("loading", "Ich höre zu...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (userInput) {
        const currentVal = userInput.value.trim();
        const space = currentVal.length > 0 ? " " : "";
        userInput.value = currentVal + space + transcript;
        userInput.focus();
      }
    };

    recognition.onend = () => {
      this._isListening = false;
      micBtn.classList.remove("text-red-600", "animate-pulse");
      this.updateStatus("default", "Bereit");
    };

    recognition.onerror = () => {
      this.updateStatus("error", "Spracherkennung abgebrochen");
    };

    micBtn.onclick = () => {
      if (this._isListening) recognition.stop();
      else recognition.start();
    };
  },

  /**
   * Internal helper to find the best German voice
   */
  _getBestVoice(isFemale) {
    const voices = window.speechSynthesis.getVoices();
    const germanVoices = voices.filter((v) => v.lang.startsWith("de"));
    if (germanVoices.length === 0)
      return voices.find((v) => v.lang.startsWith("de")) || null;

    const keywords = isFemale ? VOICE_KEYWORDS.female : VOICE_KEYWORDS.male;

    // 1. High Quality Match
    let voice = germanVoices.find((v) => {
      const name = v.name.toLowerCase();
      const isHQ = VOICE_KEYWORDS.highQuality.some((k) => name.includes(k));
      return isHQ && keywords.some((k) => name.includes(k));
    });

    // 2. Gender Match Fallback
    if (!voice) {
      voice = germanVoices.find((v) =>
        keywords.some((k) => v.name.toLowerCase().includes(k)),
      );
    }

    // 3. Any German Fallback
    return voice || germanVoices[0];
  },

  _showBrowserRecommendation() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("firefox")) {
      this.updateStatus(
        "info",
        "Tipp: Für bessere Stimmen nutze Chrome oder Edge.",
      );
    } else if (ua.includes("chrome") && !ua.includes("edge")) {
      this.updateStatus(
        "info",
        "Tipp: In Edge gibt es noch natürlichere Neural-Stimmen.",
      );
    } else if (ua.includes("edge")) {
      this.updateStatus(
        "info",
        "Perfekt! Edge hat die besten kostenlosen Stimmen.",
      );
    }
  },

  speak(text, roleName, btnElement = null) {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking && this._lastSpokenText === text) {
      window.speechSynthesis.cancel();
      this._lastSpokenText = null;
      return;
    }

    window.speechSynthesis.cancel();
    this._lastSpokenText = text;

    let cleanedText = Utils.cleanTextForSpeech(text);

    // Force a final punctuation mark if none is present
    if (!/[.!?]$/.test(cleanedText)) {
      cleanedText += ".";
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const isFemale =
      roleName?.toLowerCase().endsWith("in") ||
      roleName?.toLowerCase().includes("mitarbeiterin");
    const isMentor =
      roleName?.toLowerCase().includes("mentor") ||
      roleName?.toLowerCase().includes("feedback");

    const voice = this._getBestVoice(isFemale);
    if (voice) utterance.voice = voice;

    // Only show tip if we didn't find a high-quality (neural) voice
    if (!voice?.name.toLowerCase().includes("neural")) {
      this._showBrowserRecommendation();
    }

    utterance.lang = "de-DE";

    const isNeural = voice?.name.toLowerCase().includes("neural");

    // Dynamic voice tweaking for more natural speech
    if (isMentor) {
      // The mentor speaks calmer, more authoritative and a bit more composed
      utterance.rate = isNeural ? 0.88 : 0.85;
      utterance.pitch = 0.95;
    } else {
      // The partner speaks more naturally/a bit faster
      utterance.rate = isNeural ? 0.95 : 0.9;
      utterance.pitch = isFemale ? 1.05 : 0.98;
    }

    // Improved parameters for more natural pronunciation
    utterance.volume = 0.9; // Slightly quieter for more natural sound
    utterance.pitch += Math.random() * 0.02 - 0.01; // Minimal variation for naturalness

    if (btnElement) {
      utterance.onstart = () =>
        btnElement.classList.add(
          "text-blue-600",
          "animate-pulse",
          "opacity-100",
        );
      utterance.onend = () => {
        btnElement.classList.remove(
          "text-blue-600",
          "animate-pulse",
          "opacity-100",
        );
        // Reset status to default after speaking
        setTimeout(() => this.updateStatus("default", "Ready"), 3000);
      };
      utterance.onerror = utterance.onend;
    }

    // Introduce a tiny delay to prevent "swallowing" the first letters,
    // which often occur due to the asynchronous processing of cancel() and speak().
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  },

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
   * Toggles the briefing content visibility.
   * @param {boolean} expanded - Whether the briefing should be shown.
   */
  setBriefingExpanded(expanded) {
    const { briefingContent, chevron } = this.elements;
    briefingContent?.classList.toggle("hidden", !expanded);
    if (chevron)
      chevron.style.transform = expanded ? "rotate(0deg)" : "rotate(90deg)";
  },

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

  showFeedbackModal(feedback) {
    const { feedbackModal } = this.elements;
    const feedbackText = document.getElementById("feedback-text");
    this.toggleMobileMenu(true);
    if (feedbackText)
      Utils.renderBoldMarkdownWithLineBreaks(feedbackText, feedback);
    feedbackModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  },

  openResetModal() {
    const modal = this.elements.resetModal;
    this.toggleMobileMenu(true);
    modal.classList.remove("hidden");
    const content = modal.querySelector("div");
    setTimeout(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }, 10);
  },
};

// Global bindings for HTML onclick attributes
window.closeFeedbackModal = () => {
  UI.elements.feedbackModal.classList.add("hidden");
  document.body.style.overflow = "auto";
};

window.closeResetModal = () => {
  const modal = UI.elements.resetModal;
  const content = modal.querySelector("div");
  content.classList.replace("scale-100", "scale-95");
  setTimeout(() => modal.classList.add("hidden"), 200);
};

/**
 * Updates the subtitle responsive text.
 */
export const updateSubtitleText = () => {
  const sub = document.getElementById("main-subtitle");
  if (!sub) return;
  const base = "Wähle ein Szenario aus, um zu starten.";
  sub.innerHTML =
    window.innerWidth < 1024
      ? `${base} <br><span class="text-xs text-blue-600">Szenario wechseln? Klicke oben rechts auf ☰</span>`
      : base;
};

window.updateSubtitleText = updateSubtitleText;
