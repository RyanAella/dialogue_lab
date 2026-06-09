import { Avatar } from "./avatar.js";
import { Speech } from "./Speech.js";
import { Utils } from "./utils.js";

/**
 * @module UI
 * Modular UI Manager for the Dialogue Lab.
 * Handles dynamic rendering, DOM event binding, and multimedia integration (TTS/STT).
 */

/**
 * Visual configurations for the status box to prevent re-allocation during updates.
 */
const STATUS_CONFIGS = {
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

/**
 * Mapping of message senders/types to their respective visual styles and labels.
 */
const MESSAGE_STYLES = {
  user: {
    label: "Deine Antwort",
    cls: "bg-blue-600 text-white rounded-tr-none",
  },
  partner: {
    label: "Partner",
    cls: "bg-white text-slate-800 border-slate-100 rounded-tl-none",
  },
  task: {
    label: "Aufgabe",
    cls: "bg-sky-50 text-sky-900 border-sky-100 rounded-tl-none",
  },
  feedback: {
    label: "Feedback",
    cls: "bg-indigo-50 text-indigo-900 border-indigo-100 rounded-tl-none",
  },
};

export const UI = {
  /**
   * Centralized storage for DOM elements.
   * Properties are populated during initialization.
   * @type {Object.<string, HTMLElement>}
   */
  elements: {},

  /** Cached references to avatar image layers to avoid repeated DOM lookups */
  _avatarNodes: { main: {}, mobile: {} },

  /** Avatar Animation State */
  _avatar: {
    isTalking: false,
    blinkTimeout: null,
    mouthInterval: null,
    config: {
      // Wird über initAvatar(profile) befüllt
    },
    current: {
      body: 0,
      clothes: 0,
      hair: 0,
      hands: 0,
      glasses: 0, // Neu: Brillen-Index
      headset: 0, // Neu: Headset-Index
      eyes: 0,
      mouth: 0,
      skinTone: "a",
    },
  },

  /**
   * Initializes the avatar character and randomizes its appearance.
   * @param {Object|Object[]} data - A single character profile or a pool of profiles.
   */
  initAvatar(data) {
    Avatar.setup(data);
  },

  /**
   * Automatically binds DOM elements to the UI.elements object based on ID mapping.
   * Converts kebab-case HTML IDs to camelCase JS properties.
   * Also initializes Avatar node references.
   * @private
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
      "partner-name-display",
    ];
    ids.forEach((id) => {
      const camelCaseId = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      this.elements[camelCaseId] = document.getElementById(id);
    });
    // Remap specific non-standard IDs
    this.elements.exerciseSelect = this.elements.exercises;
    this.elements.scenarioSelect = this.elements.scenarios;

    const mainNodes = {};
    const mobileNodes = {};
    Avatar.getLayers().forEach((layer) => {
      mainNodes[layer] = document.getElementById(`partner-${layer}`);
      mobileNodes[layer] = document.getElementById(`partner-${layer}-mobile`);
    });
    Avatar.init(mainNodes, mobileNodes);
  },

  /**
   * Updates the sidebar visibility or layout based on the current application mode.
   * @param {string} mode - The active mode (e.g., 'roleplay', 'transformation').
   * @todo Implement logic for transformation mode if needed.
   */
  updateSidebarVisibility(mode) {
    const isTransformation = mode === "transformation";
    this.elements.scenarioSection?.classList.toggle("hidden", isTransformation);
    this.elements.exerciseSection?.classList.toggle(
      "hidden",
      !isTransformation,
    );
  },

  /**
   * Updates the global status box with a message and a colored visual indicator.
   * @param {string} type - The status type ('loading', 'error', or 'default').
   * @param {string} message - The text to display.
   */
  updateStatus(type, message) {
    const { statusBox } = this.elements;
    if (!statusBox) return;

    const config = STATUS_CONFIGS[type] || STATUS_CONFIGS.default;
    const baseCls =
      "status-box p-3 rounded-xl border text-xs font-medium transition-all duration-300 flex items-center gap-2";

    statusBox.className = `${baseCls} ${config.cls}`;
    statusBox.innerHTML = `<span class="h-2 w-2 rounded-full ${config.dot}"></span>`;

    const textSpan = document.createElement("span");
    textSpan.textContent = message;
    statusBox.appendChild(textSpan);
  },

  /**
   * Creates and appends a new message bubble to the chat window.
   * @param {string} text - The message content.
   * @param {string} sender - Who sent the message ('user' or 'partner').
   * @param {Object} [options] - Additional configuration.
   * @param {string} [options.roleName] - Name to display for the partner (defaults to 'Partner').
   * @param {boolean} [options.isIchMode] - Special formatting mode (defaults to false).
   * @param {string} [options.messageType] - Visual style of the bubble (defaults to 'default').
   * @param {boolean} [options.shouldScroll=true] - Whether to auto-scroll to bottom.
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
   * Displays a typing indicator bubble in the chat.
   * @param {string} roleName - The name of the character currently "typing".
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

  /**
   * Removes the typing indicator and stops avatar talking animation.
   */
  hideTypingIndicator() {
    document.getElementById("typing-indicator")?.remove();
  },

  /**
   * Internal helper to create the avatar visual for a message.
   * For the user, it returns a simple circle; for the partner, it renders the layered stack.
   * @param {string} sender - 'user' or 'partner'.
   * @param {Object} options - Configuration object containing roleName.
   * @returns {HTMLElement} The created avatar element.
   * @private
   */
  _createAvatar(sender, { roleName = "Partner" }) {
    const avatar = document.createElement("div");

    if (sender === "user") {
      avatar.className =
        "flex items-center justify-center text-xs shadow-sm flex-shrink-0 mt-1 w-8 h-8 rounded-full bg-blue-700 text-white border-2 border-blue-400";
      avatar.textContent = "DU";
      return avatar;
    }

    // Partner Avatar: Uses the layer system (avatar stack)
    if (Avatar.getConfig()) {
      avatar.className =
        "avatar-stack w-10 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 mt-1 shadow-sm relative";

      Avatar.getLayers().forEach((layer) => {
        const src = Avatar._getLayerSrc(layer);
        if (src) {
          const img = document.createElement("img");
          img.className = "absolute inset-0 w-full h-full object-contain";
          img.src = src;
          avatar.appendChild(img);
        }
      });
    } else {
      avatar.className =
        "w-8 h-8 rounded-full bg-gray-300 text-gray-600 border-2 border-white flex items-center justify-center text-xs flex-shrink-0 mt-1";
      avatar.textContent = roleName.substring(0, 2).toUpperCase();
    }
    return avatar;
  },

  /**
   * Internal helper to create the message content container (label + bubble).
   * Includes the text-to-speech trigger button.
   * @param {string} text - Message text.
   * @param {string} sender - 'user' or 'partner'.
   * @param {Object} options - Configuration object.
   * @param {string} options.messageType - Style key.
   * @param {string} options.roleName - Label for the partner.
   * @param {boolean} options.isIchMode - Formatting toggle.
   * @returns {HTMLElement} The created message body container.
   * @private
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

    const styleKey = isIchMode && sender !== "user" ? messageType : sender;
    const config = MESSAGE_STYLES[styleKey] || MESSAGE_STYLES.partner;
    const displayLabel = styleKey === "partner" ? roleName : config.label;

    // Create Label with Speech Button
    const nameLabel = document.createElement("div");
    nameLabel.className =
      "text-xs text-gray-500 mb-1 px-1 flex items-center gap-1.5";
    nameLabel.textContent = displayLabel;

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

  /**
   * Shows or hides additional exercise action buttons.
   * @param {boolean} visible
   */
  setExerciseActionsVisible(visible) {
    this.elements.exerciseActions?.classList.toggle("hidden", !visible);
  },

  /**
   * Handles UI transitions when a user starts an interaction (collapses briefing).
   */
  prepareForInteraction() {
    const { briefingContent, chevron, startInfo } = this.elements;

    // Collapse briefing and hide initial info
    if (briefingContent) briefingContent.classList.add("hidden");
    if (chevron) chevron.style.transform = "rotate(90deg)";
    if (startInfo) startInfo.classList.add("hidden");
  },

  /**
   * Sets the content and style of the current mode badge.
   * @returns {void}
   */
  setModeBadge(mode) {
    const { modeBadge } = this.elements;
    if (!modeBadge) return;
    if (mode === "transformation") {
      modeBadge.textContent = "Modus: Übungen";
      modeBadge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200";
    }
  },

  /**
   * Updates the state and appearance of input elements (User Input, Send, Mic).
   * @param {boolean} disabled - Whether the inputs should be locked.
   * @param {string} placeholder - The text to show in the empty input field.
   * @returns {void}
   */
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

  /**
   * Main UI entry point. Binds elements, initializes avatar and voice systems.
   */
  init(initialProfile = null) {
    // Bind all DOM elements to UI.elements before setting up logic
    this._bindElements();

    if (initialProfile) this.initAvatar(initialProfile);

    if (this.elements.speakBriefingBtn) {
      this.elements.speakBriefingBtn.onclick = (e) => {
        e.stopPropagation();
        this.speak(
          this.elements.briefingContent.innerText,
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

    this._voiceSupported = Speech.initSTT(
      this.elements.micBtn,
      this.elements.userInput,
      (t, m) => this.updateStatus(t, m),
    );

    // Ensure voices are loaded (crucial for Chrome)
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => Speech._getBestVoice(true);
    }
  },

  /**
   * Shows a one-time status hint recommending browsers with better voice support.
   * @returns {void}
   * @private
   */
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

  /**
   * Performs text-to-speech for a given text.
   * Handles voice selection, text cleaning, and UI animation states.
   * @param {string} text - The raw text to speak.
   * @param {string} roleName - Used to determine the appropriate voice (gender/role).
   * @param {HTMLElement} [btnElement=null] - The button to animate during playback.
   */
  speak(text, roleName, btnElement = null) {
    const showHint = Speech.speak(text, {
      roleName,
      btnElement,
      avatar: Avatar,
      onStatus: (t, m) => this.updateStatus(t, m),
    });

    if (showHint) {
      this._showBrowserRecommendation();
    }
  },

  /**
   * Replaces briefing content with a loading spinner.
   * @param {boolean} isLoading
   * @returns {void}
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
   * Toggles the briefing content visibility.
   * @param {boolean} expanded - Whether the briefing should be shown.
   * @returns {void}
   */
  setBriefingExpanded(expanded) {
    const { briefingContent, chevron } = this.elements;
    briefingContent?.classList.toggle("hidden", !expanded);
    if (chevron)
      chevron.style.transform = expanded ? "rotate(0deg)" : "rotate(90deg)";
  },

  /**
   * Toggles the mobile navigation sidebar and the background overlay.
   * @param {boolean} [forceClose=false] - If true, always closes the menu.
   * @returns {void}
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

  /**
   * Populates and displays the feedback modal window.
   * @param {string} feedback - The markdown/text content for the feedback.
   */
  showFeedbackModal(feedback) {
    const { feedbackModal } = this.elements;
    const feedbackText = document.getElementById("feedback-text");
    this.toggleMobileMenu(true);
    if (feedbackText)
      Utils.renderBoldMarkdownWithLineBreaks(feedbackText, feedback);
    feedbackModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  },

  /**
   * Opens the confirmation modal for resetting the current simulation.
   * @returns {void}
   */
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

/**
 * Global helper for closing the feedback modal.
 * Bound to window for HTML onclick compatibility.
 * @returns {void}
 */
window.closeFeedbackModal = () => {
  UI.elements.feedbackModal.classList.add("hidden");
  document.body.style.overflow = "auto";
};

/**
 * Global helper for closing the reset modal with a scale-out animation.
 */
window.closeResetModal = () => {
  const modal = UI.elements.resetModal;
  const content = modal.querySelector("div");
  content.classList.replace("scale-100", "scale-95");
  setTimeout(() => modal.classList.add("hidden"), 200);
};

/**
 * Updates the subtitle text based on screen width.
 * Provides a hint for mobile users on how to access the menu.
 * @returns {void}
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

window.updateSubtitleText = updateSubtitleText;
