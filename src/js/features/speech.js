import { Utils } from '../utils/utils.js';
import { VOICE_KEYWORDS, SPEECH_CONFIG, MENTOR_KEYWORDS } from '../core/config.js';

/**
 * Service for handling Speech-to-Text (STT) and Text-to-Speech (TTS).
 * Wraps the Web Speech API to provide a unified interface for the application.
 */
export const Speech = {
  /** @private {boolean} Tracks the recording state of the microphone */
  _isListening: false,
  /** @type {string|null} @private Stores the last spoken text to handle toggle logic */
  _lastSpokenText: /** @type {string|null} */ (null),
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
    this._recognition.lang = SPEECH_CONFIG.LANG;
    this._recognition.continuous = true;
    this._recognition.interimResults = false;
    // Some browsers (e.g. Chrome) stop the recognition on their own after a
    // few seconds of silence. Restart it as long as the user has not
    // explicitly stopped it by toggling the microphone button.
    this._recognition.autoRestart = false;

    this._recognition.onstart = () => {
      this._isListening = true;
      micBtn.classList.add("text-red-600", "animate-pulse");
      statusCallback("loading", "Ich höre zu...");
    };

    this._recognition.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
      }
      if (!transcript) return;
      const currentVal = userInput.value.trim();
      userInput.value = currentVal + (currentVal ? " " : "") + transcript.trim();
      userInput.focus();
      // Trigger das Event manuell, damit der Senden-Button aktiviert wird
      userInput.dispatchEvent(new Event("input", { bubbles: true }));
    };

    this._recognition.onend = () => {
      if (this._recognition.autoRestart) {
        // Slight delay: calling start() synchronously inside onend can throw
        // an InvalidStateError in some browsers.
        setTimeout(() => {
          if (!this._recognition.autoRestart) return;
          try {
            this._recognition.start();
          } catch (e) {
            this._isListening = false;
            micBtn.classList.remove("text-red-600", "animate-pulse");
            statusCallback("default", "Bereit");
          }
        }, 250);
        return;
      }
      this._isListening = false;
      micBtn.classList.remove("text-red-600", "animate-pulse");
      statusCallback("default", "Bereit");
    };

    this._recognition.onerror = (e) => {
      // "no-speech" and "aborted" are expected during continuous listening;
      // everything else is surfaced to the user via the status line.
      if (e.error !== "no-speech" && e.error !== "aborted") {
        statusCallback("error", `Spracherkennung: ${e.error}`);
      }
    };

    micBtn.onclick = () => {
      if (this._isListening) {
        this._recognition.autoRestart = false;
        this._recognition.stop();
      } else {
        this._recognition.autoRestart = true;
        try {
          this._recognition.start();
        } catch (e) {
          this._isListening = false;
        }
      }
    };
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
    utterance.lang = SPEECH_CONFIG.LANG;

    const config = avatar?.getConfig();
    // Korrektur der Logik: kein !! bei String-Vergleich
    let isFemale = roleName?.toLowerCase().endsWith("in") || config?.gender === "female";
    if (config?.gender) isFemale = (config.gender === "female");

    const voice = this._getBestVoice(isFemale);
    if (voice) utterance.voice = voice;

    const isHQ = voice?.name.toLowerCase().includes("neural");
    const isMentor = roleName && MENTOR_KEYWORDS.some(kw => roleName.toLowerCase().includes(kw));

    utterance.rate = isMentor ? (isHQ ? 1.05 : 1.0) : isHQ ? 0.95 : 0.9;
    utterance.pitch = isMentor ? 0.95 : isFemale ? 1.05 : 0.98;
    utterance.volume = SPEECH_CONFIG.VOLUME;

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
        if (onStatus) setTimeout(() => onStatus("default", "Bereit"), 3000);
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
