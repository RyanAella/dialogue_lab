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

    const nameLabel = document.createElement("span");
    nameLabel.className =
      "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1";
    nameLabel.textContent = label;

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
    const { userInput, sendBtn } = this.elements;
    userInput.disabled = disabled;
    sendBtn.disabled = disabled;
    userInput.placeholder = placeholder;

    // Hintergrund und Cursor-Styles umschalten
    userInput.classList.toggle("bg-gray-100", disabled);
    userInput.classList.toggle("bg-slate-50", !disabled);
    userInput.classList.toggle("cursor-not-allowed", disabled);

    sendBtn.classList.toggle("opacity-50", disabled);
    sendBtn.classList.toggle("cursor-not-allowed", disabled);
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
