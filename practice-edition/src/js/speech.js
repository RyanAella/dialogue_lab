import { Utils } from "./utils.js";

/**
 * Keywords used to filter and select the most appropriate system voices.
 * @constant {Object}
 */
const VOICE_KEYWORDS = {
  female: ["katja", "maren", "anna", "zira", "clara", "julia", "verena"],
  male: ["stefan", "conrad", "kasper", "killian", "hans", "michael"],
  highQuality: ["neural", "natural", "online", "premium", "enhanced"],
};

/**
 * Service for handling Speech-to-Text (STT) and Text-to-Speech (TTS).
 * Wraps the Web Speech API to provide a unified interface for the application.
 */
export const Speech = {
  /** @private {boolean} Tracks the recording state of the microphone */
  _isListening: false,
  /** @private {string|null} Stores the last spoken text to handle toggle logic */
  _lastSpokenText: null,
  /** @private {SpeechRecognition|null} Reference to the recognition instance */
  _recognition: null,

  /**
   * Initializes Speech-to-Text (Speech Recognition) functionality.
   * Checks for browser support and binds events to the UI elements.
   *
   * @param {HTMLElement} micBtn - The button used to toggle voice input.
   * @param {HTMLTextAreaElement|HTMLInputElement} userInput - The input field where text will be appended.
   * @param {Function} statusCallback - Callback to update the UI status (type, message).
   * @returns {boolean} True if the browser supports Speech Recognition, false otherwise.
   */
  initSTT(micBtn, userInput, statusCallback) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    this._recognition = new SpeechRecognition();
    this._recognition.lang = "de-DE";

    this._recognition.onstart = () => {
      this._isListening = true;
      micBtn.classList.add("text-red-600", "animate-pulse");
      statusCallback("loading", "Ich höre zu...");
    };

    this._recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const currentVal = userInput.value.trim();
      userInput.value = currentVal + (currentVal ? " " : "") + transcript;
      userInput.focus();
    };

    this._recognition.onend = () => {
      this._isListening = false;
      micBtn.classList.remove("text-red-600", "animate-pulse");
      statusCallback("default", "Bereit");
    };

    micBtn.onclick = () =>
      this._isListening ? this._recognition.stop() : this._recognition.start();
    return true;
  },

  /**
   * Finds the best available German voice based on gender and quality keywords.
   *
   * @param {boolean} isFemale - Whether to prioritize a female voice.
   * @returns {SpeechSynthesisVoice|null} The selected voice or null if none found.
   * @private
   */
  _getBestVoice(isFemale) {
    const voices = window.speechSynthesis.getVoices();
    const germanVoices = voices.filter((v) => v.lang.startsWith("de"));
    if (!germanVoices.length)
      return voices.find((v) => v.lang.startsWith("de")) || null;

    const keywords = isFemale ? VOICE_KEYWORDS.female : VOICE_KEYWORDS.male;
    let voice = germanVoices.find((v) => {
      const name = v.name.toLowerCase();
      return (
        VOICE_KEYWORDS.highQuality.some((k) => name.includes(k)) &&
        keywords.some((k) => name.includes(k))
      );
    });

    return (
      voice ||
      germanVoices.find((v) =>
        keywords.some((k) => v.name.toLowerCase().includes(k)),
      ) ||
      germanVoices[0]
    );
  },

  /**
   * Performs text-to-speech for the given text.
   * Handles cleaning, voice selection, and coordinated animations.
   *
   * @param {string} text - The raw text content to speak.
   * @param {Object} [options={}] - Configuration for the speech output.
   * @param {string} [options.roleName] - Name of the role to determine voice gender.
   * @param {HTMLElement} [options.btnElement] - Button to animate during playback.
   * @param {Object} [options.avatar] - Avatar component to trigger talking animations.
   * @param {Function} [options.onStatus] - Callback to report status changes.
   * @returns {boolean} Returns true if the selected voice is low-quality (suggesting a browser hint).
   */
  speak(text, options = {}) {
    const { roleName, btnElement, avatar, onStatus } = options;
    if (!window.speechSynthesis) return false;

    if (window.speechSynthesis.speaking && this._lastSpokenText === text) {
      window.speechSynthesis.cancel();
      this._lastSpokenText = /** @type {string|null} */ (null);
      return false;
    }

    window.speechSynthesis.cancel();
    this._lastSpokenText = text;

    let cleaned = Utils.cleanTextForSpeech(text);
    if (!/[.!?]$/.test(cleaned)) cleaned += ".";

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "de-DE";

    const config = avatar?.getConfig();
    let isFemale = roleName?.toLowerCase().endsWith("in") || config?.gender === "female";
    if (config?.gender) isFemale = (config.gender === "female");

    const voice = this._getBestVoice(isFemale);
    if (voice) utterance.voice = voice;

    const isHQ = voice?.name.toLowerCase().includes("neural");
    const isCoach =
      roleName?.toLowerCase().includes("coach") ||
      roleName?.toLowerCase().includes("feedback");

    utterance.rate = isCoach ? (isHQ ? 0.88 : 0.85) : isHQ ? 0.95 : 0.9;
    utterance.pitch = isCoach ? 0.95 : isFemale ? 1.05 : 0.98;
    utterance.volume = 0.9;

    if (btnElement) {
      utterance.onstart = () => {
        btnElement.classList.add(
          "text-blue-600",
          "animate-pulse",
          "opacity-100",
        );
        avatar?.setTalking(true);
      };
      utterance.onend = () => {
        btnElement.classList.remove(
          "text-blue-600",
          "animate-pulse",
          "opacity-100",
        );
        avatar?.setTalking(false);
        if (onStatus) setTimeout(() => onStatus("default", "Ready"), 3000);
      };
      utterance.onerror = utterance.onend;
    }

    setTimeout(() => window.speechSynthesis.speak(utterance), 100);

    return !isHQ; // Returns true if a browser recommendation should be shown
  },

  /**
   * Immediately stops any ongoing speech synthesis and resets the internal state.
   */
  stop() {
    window.speechSynthesis.cancel();
    this._lastSpokenText = /** @type {string|null} */ (null);
  },
};
