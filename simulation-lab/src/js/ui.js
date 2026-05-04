/**
 * UI Manager - Responsible for DOM elements and visual updates
 */

import { Utils } from "./utils.js";

export const UI = {
  // DOM Elemente
  elements: {
    briefingHeader: document.getElementById("briefing-header"),
    briefingContent: document.getElementById("briefing-content"),
    chevron: document.getElementById("chevron"),
    scenarioSelect: document.getElementById("scenarios"),
    chatWindow: document.getElementById("chat-window"),
    startInfo: document.getElementById("start-info"),
    userInput: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    statusBox: document.getElementById("status-box"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    feedbackBtn: document.getElementById("feedback-btn"),
    resetBtn: document.getElementById("reset-btn"),
    loadingOverlay: document.getElementById("loading-overlay"),
    feedbackModal: document.getElementById("feedback-modal"),
    resetModal: document.getElementById("reset-modal"),
    autoSpeakToggle: document.getElementById("auto-speak-toggle"),
    speakBriefingBtn: document.getElementById("speak-briefing-btn"),
    stopSpeechBtn: document.getElementById("stop-speech-btn"),
    micBtn: document.getElementById("mic-btn"),
  },

  updateStatus(type, message) {
    const { statusBox } = this.elements;
    if (!statusBox) return;

    // Basis-Styling: Weißer Hintergrund, neutraler Rahmen, keine Schatten
    let classes =
      "status-box p-3 rounded-xl border text-xs font-medium transition-all duration-300 flex items-center gap-2 ";
    let dot = `<span class="relative flex h-2 w-2">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-2 w-2"></span>
               </span>`;

    if (type === "loading") {
      classes += "text-indigo-700";
      dot = `<span class="relative flex h-2 w-2">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-indigo-500"></span>
               <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
             </span>`;
    } else if (type === "error") {
      classes += "text-red-700";
      dot = `<span class="h-2 w-2 rounded-full bg-red-500"></span>`;
    } else {
      classes += "text-emerald-700";
      dot = `<span class="h-2 w-2 rounded-full bg-emerald-500"></span>`;
    }
    statusBox.className = classes;
    statusBox.innerHTML = `${dot} <span>${message}</span>`;
  },

  appendMessage(text, sender, options = {}) {
    const { chatWindow } = this.elements;
    const {
      messageType = "default",
      roleName = "Partner",
      shouldScroll = true,
    } = options;
    const wrapper = document.createElement("div");
    const avatar = document.createElement("div");
    const isFemale = sender !== "user" && roleName.toLowerCase().endsWith("in");

    avatar.className = `flex items-center justify-center text-xs shadow-sm flex-shrink-0 mt-1 ${
      sender === "user"
        ? "w-8 h-8 rounded-full bg-blue-700 text-white border-2 border-blue-400"
        : isFemale
          ? "w-12 h-16 rounded-xl bg-white border-2 border-white overflow-hidden"
          : "w-8 h-8 rounded-full bg-gray-300 text-gray-600 border-2 border-white"
    }`;

    if (sender === "user") avatar.textContent = "DU";
    else if (isFemale) {
      const img = document.createElement("img");
      img.src = "src/assets/grafik.png";
      img.className = "w-full h-full object-cover";
      avatar.appendChild(img);
    } else avatar.textContent = roleName.substring(0, 2).toUpperCase();

    const contentDiv = document.createElement("div");
    contentDiv.className =
      sender === "user"
        ? "flex flex-col items-end message-animate"
        : "flex flex-col items-start message-animate";

    let label = sender === "user" ? "Deine Antwort" : roleName;
    let bubbleClass =
      sender === "user"
        ? "bg-blue-600 text-white px-5 py-4 rounded-[22px] rounded-tr-none shadow-lg shadow-blue-500/10"
        : "bg-white text-slate-800 px-5 py-4 rounded-[22px] rounded-tl-none shadow-sm border border-slate-100";

    wrapper.className =
      sender === "user"
        ? `flex flex-row-reverse items-start mb-6 gap-3 ml-auto max-w-[92%] md:max-w-[85%]`
        : `flex flex-row items-start mb-6 gap-3 mr-auto max-w-[92%] md:max-w-[85%]`;

    const nameLabel = document.createElement("div");
    nameLabel.className =
      "text-xs text-gray-500 mb-1 px-1 flex items-center gap-1.5";
    nameLabel.textContent = label;

    const speakBtn = document.createElement("button");
    speakBtn.className =
      "hover:text-blue-600 transition-colors opacity-60 hover:opacity-100 p-0.5";
    speakBtn.title = "Vorlesen";
    speakBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414-1.414 5 5 0 000-7.072 1 1 0 011.414-1.414 7 7 0 010 9.9z" clip-rule="evenodd" />
      </svg>`;
    speakBtn.onclick = (e) => this.speak(text, label, e.currentTarget);
    nameLabel.appendChild(speakBtn);

    const msgBubble = document.createElement("div");
    msgBubble.className = bubbleClass;
    msgBubble.style.whiteSpace = "pre-wrap";
    msgBubble.textContent = text;

    contentDiv.appendChild(nameLabel);
    contentDiv.appendChild(msgBubble);
    wrapper.appendChild(avatar);
    wrapper.appendChild(contentDiv);
    chatWindow.appendChild(wrapper);

    if (shouldScroll) {
      requestAnimationFrame(() => {
        const main = chatWindow.closest("main");
        if (main) main.scrollTop = main.scrollHeight;
      });
    }
  },

  updateInputUI(disabled, placeholder) {
    const { userInput, sendBtn, micBtn } = this.elements;
    const micDisabled = disabled || !this._voiceSupported;

    userInput.disabled = disabled;
    sendBtn.disabled = disabled;
    if (micBtn) micBtn.disabled = micDisabled;
    userInput.placeholder = placeholder;

    // Hintergrund und Cursor-Styles umschalten
    userInput.classList.toggle("bg-gray-100", disabled);
    userInput.classList.toggle("cursor-not-allowed", disabled);

    sendBtn.classList.toggle("opacity-50", disabled);
    sendBtn.classList.toggle("cursor-not-allowed", disabled);

    if (micBtn) micBtn.classList.toggle("opacity-50", micDisabled);
    if (micBtn) micBtn.classList.toggle("cursor-not-allowed", micDisabled);
  },

  /**
   * Steuert das Ein-/Ausklappen des Briefings
   */
  setBriefingExpanded(expanded) {
    const { briefingContent, chevron } = this.elements;
    if (!briefingContent) return;
    briefingContent.classList.toggle("hidden", !expanded);
    if (chevron)
      chevron.style.transform = expanded ? "rotate(0deg)" : "rotate(90deg)";
  },

  init() {
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

    // Stopp-Button in der Sidebar
    if (this.elements.stopSpeechBtn) {
      this.elements.stopSpeechBtn.onclick = () => {
        window.speechSynthesis.cancel();
        if (this.elements.autoSpeakToggle) {
          this.elements.autoSpeakToggle.checked = false;
          // Event auslösen, damit app.js den STATE.ttsEnabled auf false setzt
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
      micBtn.classList.add("text-red-600", "animate-pulse");
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

  speak(text, roleName, btnElement = null) {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking && this._lastSpokenText === text) {
      window.speechSynthesis.cancel();
      this._lastSpokenText = null;
      return;
    }

    window.speechSynthesis.cancel();
    this._lastSpokenText = text;

    // Fortgeschrittene Text-Optimierung für natürliche Pausen:
    let cleanedText = text
      .replace(/\*\*|\*/g, "") // Markdown entfernen
      .replace(/\(.*?\)/g, "") // Regieanweisungen (Klammern) entfernen
      .replace(/\[.*?\]/g, "") // Regieanweisungen [Klammern] entfernen
      .replace(/\n\n+/g, ". ... . ") // Doppelte Zeilenumbrüche = Lange Pause
      .replace(/:\s*\n/g, ". ... . ") // Doppelpunkt am Zeilenende = Lange Pause
      .replace(/:\s*/g, ", ... ") // Doppelpunkt im Satz = Nachdenkliche Pause
      .replace(/\n/g, ". ") // Einfacher Umbruch = Normale Pause
      .replace(/([.!?])\s+/g, "$1 ... ") // Nach jedem Satzende eine winzige Zusatzpause
      .replace(/\.\s+\.\s+\./g, "...") // Korrektur für entstandene Dreifachpunkte
      .replace(/\s+/g, " ") // Whitespace aufräumen
      .trim();

    // Ein finales Satzzeichen erzwingen, falls keines da ist
    if (!/[.!?]$/.test(cleanedText)) {
      cleanedText += ".";
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const voices = window.speechSynthesis.getVoices();
    const isFemale =
      roleName?.toLowerCase().endsWith("in") ||
      roleName?.toLowerCase().includes("mitarbeiterin");

    const isMentor =
      roleName?.toLowerCase().includes("mentor") ||
      roleName?.toLowerCase().includes("feedback");

    const germanVoices = voices.filter((v) => v.lang.startsWith("de"));

    // 1. Suche nach High-Quality (Neural/Natural)
    let voice = germanVoices.find((v) => {
      const name = v.name.toLowerCase();
      const isHighQuality =
        name.includes("neural") ||
        name.includes("natural") ||
        name.includes("online");
      const femaleKeywords = ["katja", "maren", "anna", "zira", "hedda"];
      const maleKeywords = ["stefan", "conrad", "kasper", "killian"];

      const match = isFemale
        ? femaleKeywords.some((k) => name.includes(k))
        : maleKeywords.some((k) => name.includes(k));

      return isHighQuality && match;
    });
    // 2. FIREFOX CHECK: Wenn keine High-Quality Stimme gefunden wurde
    if (!voice) {
      // Dezenten Hinweis in der Statusbox anzeigen (da Firefox meist nur Standard-Stimmen hat)
      this.updateStatus(
        "info",
        "Hinweis: In Edge klingen die Stimmen noch natürlicher.",
      );

      // Fallback auf normale Systemstimmen (dein alter Code)
      const femaleKeywords = ["hedda", "katja", "anna", "elke"];
      const maleKeywords = ["stefan", "conrad", "markus"];

      voice = germanVoices.find((v) => {
        const name = v.name.toLowerCase();
        return isFemale
          ? femaleKeywords.some((k) => name.includes(k))
          : maleKeywords.some((k) => name.includes(k));
      });
    }

    // 3. Fallbacks
    if (!voice) voice = germanVoices[0];
    if (!voice) voice = voices.find((v) => v.lang.startsWith("de"));

    if (voice) utterance.voice = voice;
    utterance.lang = "de-DE";

    const isNeural = voice?.name.toLowerCase().includes("neural");

    // Dynamisches Voice-Tweaking
    if (isMentor) {
      // Der Mentor spricht ruhiger, autoritärer und etwas gesetzter
      utterance.rate = isNeural ? 0.88 : 0.85;
      utterance.pitch = 0.95;
    } else {
      // Der Partner spricht natürlicher/etwas schneller
      utterance.rate = isNeural ? 0.95 : 0.9;
      utterance.pitch = isFemale ? 1.05 : 0.98;
    }

    utterance.volume = 1.0;

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
        // Status nach dem Sprechen wieder auf Standard setzen
        setTimeout(() => this.updateStatus("default", "Bereit"), 3000);
      };
      utterance.onerror = utterance.onend;
    }

    // Winzige Verzögerung einbauen, um das "Verschlucken" der ersten Buchstaben zu verhindern,
    // die oft durch die asynchrone Verarbeitung von cancel() und speak() entstehen.
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
        <span>Lade Szenario...</span>
      </div>
    `;
    this.elements.briefingContent.classList.remove("hidden");
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

window.updateSubtitleText = () => {
  const sub = document.getElementById("main-subtitle");
  if (!sub) return;
  sub.textContent =
    "Lies das Briefing und starte das Gespräch mit einer Nachricht.";
};
