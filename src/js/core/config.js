/**
 * @module Config
 * Centralized configuration settings for the Dialogue Lab application.
 * This file manages API endpoints, model parameters, and static resource paths.
 */

/**
 * Global application configuration object.
 * @type {Object}
 * @property {string} PROXY_URL - The destination endpoint for the server-side API proxy.
 * @property {string} MODEL - The identifier for the OpenAI model used (e.g., 'gpt-4o').
 * @property {number} CHAT_TEMPERATURE - Controls randomness in the AI partner's dialogue (0.0 to 1.0).
 * @property {number} COACH_TEMPERATURE - Controls randomness in the AI coach's analysis (lower for more consistency).
 * @property {string} EXERCISES_FILE - Relative path to the JSON file containing the exercise pool.
 */
export const APP_CONFIG = {
  PROXY_URL: "https://kite2.site/dialogue_lab/chat.php",
  DATALOGGER_BACKEND: "https://kite2.site/dialogue_lab/save_dialogue.php",
  MODEL: "gpt-4o",
  CHAT_TEMPERATURE: 0.7,
  COACH_TEMPERATURE: 0.3,
  ICH_BOTSCHAFT_TEMPERATURE: 0.4,
  EXERCISES_FILE: "src/data/exercises.json",
  FALLBACK_PROMPTS: {
    transformation: "Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen des Nutzers kritisch und gib konstruktives Feedback.",
    simulation: "Du bist ein Mentor. Analysiere das Gesprächsprotokoll und gib hilfreiches Feedback."
  }
};

/**
 * Visual configurations for the status box to prevent re-allocation during updates.
 */
export const STATUS_CONFIGS = {
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
export const MESSAGE_STYLES = {
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

/**
 * Configuration for mode badge display.
 */
export const MODE_BADGE_CONFIG = {
  transformation: { label: "Modus: Übungen", cls: "bg-violet-100 text-violet-700 border border-violet-200" },
  simulation: { label: "Modus: Simulationen", cls: "bg-slate-100 text-slate-700 border border-slate-200" },
};

/**
 * DOM element IDs for automatic binding in UI._bindElements().
 */
export const DOM_ELEMENT_IDS = [
  "briefing-header", "briefing-content", "chevron", "scenarios", "exercises",
  "scenario-section", "exercise-section", "mode-select", "mode-badge",
  "chat-window", "start-info", "user-input", "send-btn", "next-task-btn",
  "status-box", "mobile-menu-btn", "sidebar", "sidebar-overlay",
  "exercise-actions", "feedback-btn", "export-transcript-btn",
  "modal-download-btn", "reset-btn", "auto-speak-toggle",
  "speak-briefing-btn", "stop-speech-btn", "mic-btn",
  "loading-overlay", "loading-title", "feedback-modal",
  "feedback-modal-title", "modal-close-feedback", "modal-close-reset",
  "reset-modal", "partner-name-display",
];

/**
 * Element aliases for DOM binding (maps property names to element IDs).
 */
export const DOM_ELEMENT_ALIASES = {
  exerciseSelect: "exercises",
  scenarioSelect: "scenarios",
};

/**
 * Keywords used to filter and select the most appropriate system voices.
 */
export const VOICE_KEYWORDS = {
  female: ["katja", "maren", "anna", "zira", "clara", "julia", "verena"],
  male: ["stefan", "conrad", "kasper", "killian", "hans", "michael"],
  highQuality: ["neural", "natural", "online", "premium", "enhanced"],
};

/**
 * Speech synthesis configuration.
 */
export const SPEECH_CONFIG = {
  LANG: "de-DE",
  VOLUME: 0.9,
};

/**
 * Keywords to identify mentor roles for voice parameter adjustment.
 */
export const MENTOR_KEYWORDS = ["mentor", "feedback", "coach"];

/**
 * Exercise type constants.
 */
export const EXERCISE_TYPES = {
  TRANSFORMATION: "TRANSFORMATION",
  SIMULATION: "SIMULATION",
};

/**
 * Default values for scenario configuration.
 */
export const SCENARIO_DEFAULTS = {
  ROLE_NAME: "Coach",
  SHORT_INSTRUCTION: "Bearbeite die Aussage.",
  COMMENT_PREFIX: "#",
};

/**
 * Property name constants for exercise configuration files.
 */
export const SCENARIO_FILE_KEYS = {
  INSTRUCTION_FILE: "instructionFile",
  SCENARIO_FILE: "scenarioFile",
  SOURCE_FILE: "sourceFile",
};

/**
 * Feedback-related message configurations.
 */
export const FEEDBACK_MESSAGES = {
  loading: {
    title: {
      transformation: "Coach analysiert das Gespräch...",
      simulation: "Mentor analysiert das Gespräch...",
    },
    status: {
      transformation: "Coach analysiert...",
      simulation: "Mentor analysiert...",
    },
  },
  modal: {
    title: {
      transformation: "<span>📊</span> Coach-Analyse",
      simulation: "<span>📊</span> Mentor-Feedback",
    },
  },
  tts: {
    transformation: "Coach",
    simulation: "Mentor",
  },
  status: {
    ready: "Fertig",
    error: "Fehler: Keine Antwort von der KI erhalten.",
  },
  errorPrefix: "Fehler: ",
};

/**
 * Export-related message configurations.
 */
export const EXPORT_MESSAGES = {
  transcript: {
    header: "PROTOKOLL: ",
    modeLabel: "Modus: ",
    dateLabel: "Datum: ",
    divider: "==========================================\n\n",
    sections: {
      briefing: "### 1. BRIEFING / AUFGABE ###\n\n",
      chat: "### 2. CHAT-VERLAUF ###\n\n",
      analysis: "### 3. ABSCHLIESSENDE ANALYSE ###\n\n",
    },
    senders: {
      user: "Ich",
      coach: "Coach-Feedback",
    },
  },
  modeLabels: {
    transformation: {
      display: "Transformationstraining",
      filePrefix: "Transformation",
    },
    simulation: {
      display: "Simulation",
      filePrefix: "Simulation",
    },
  },
  status: {
    uploadSuccess: (success, failed) => `Upload abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen`,
    uploadWarning: (count) => `${count} Konversationen konnten nicht hochgeladen werden.`,
    uploadError: (error) => `Fehler beim Hochladen: ${error}`,
  },
  alerts: {
    researchStats: (stats) => `📊 Statistiken:\n\n` +
        `Gesamt Konversationen: ${stats.totalConversations}\n` +
        `Gesamt Dialogschritte: ${stats.totalTurns}\n` +
        `Aktuelle Konversation: ${stats.currentConversationId || 'Keine'}\n` +
        `Ausstehende Uploads: ${stats.pendingUploads}\n` +
        `Backend konfiguriert: ${stats.backendConfigured ? 'Ja' : 'Nein'}`,
    noToken: "Fehler: Kein Forscher-Token vorhanden",
    downloadError: (error) => `Fehler: ${error}`,
  },
};

/**
 * DataLogger configuration for storage keys and defaults.
 */
export const DATA_LOGGER_CONFIG = {
  STORAGE_KEYS: {
    CONVERSATIONS: "dialogue_lab_conversations",
    FAILED_UPLOADS: "dialogue_lab_failed_uploads",
    RESEARCHER_TOKEN: "dialogue_lab_researcher_token",
  },
  DEFAULT: {
    autoUpload: false,
    retryFailedUploads: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
};

/**
 * Chat role constants for message role identification.
 */
export const CHAT_ROLES = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
};

/**
 * Avatar configuration for image layers and fallback assets.
 */
export const AVATAR_CONFIG = {
  TRANSPARENT_PIXEL: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  LAYERS: ["body", "clothes", "hair", "glasses", "headset", "hands", "eyes", "mouth"],
};

/**
 * Avatar animation timing configuration (in milliseconds).
 */
export const AVATAR_ANIMATION = {
  MOUTH_INTERVAL: 150,
  BLINK_DURATION: 150,
  BLINK_INTERVAL_MIN: 2000,
  BLINK_INTERVAL_MAX: 6000,
};

/**
 * Application mode constants for STATE.currentMode.
 * Note: These are different from EXERCISE_TYPES (which are for exercise.type).
 */
export const APP_MODES = {
  ROLEPLAY: "roleplay",
  TRANSFORMATION: "transformation",
};

/**
 * UI text constants for buttons, labels, and messages.
 * Centralized for easier maintenance and potential internationalization.
 */
export const UI_TEXTS = {
  // Button Labels
  feedbackBtn: {
    transformation: "<span>📊</span> Auswertung erstellen",
    roleplay: "<span>📊</span> Feedback erhalten",
  },
  // Subtitles
  subtitles: {
    roleplay: "Lies das Briefing und starte das Gespräch mit einer Nachricht.",
    transformation: (title, instruction) => `${title}: ${instruction}`,
  },
  // Status Messages
  status: {
    loading: "Lade...",
    ready: "Bereit",
    roleplayActive: "Simulationen aktiv",
    transformationActive: "Transformationen aktiv",
    allExercisesDone: "Alle Aussagen bearbeitet. Klicke jetzt auf 'Auswertung erstellen', um dein abschließendes Feedback zu erhalten.",
    exerciseComplete: "Übung abgeschlossen",
    sending: "Sende...",
    analyzing: "Analysiere...",
    restarting: "restarted",
  },
  // Error Messages
  errors: {
    prefix: "Fehler:",
    noSimulations: "Keine Rollenspiel-Szenarien verfügbar.",
    noTransformations: "Keine Transformations-Übungen verfügbar.",
    noExercises: "Keine Übungen verfügbar.",
    noEntriesAvailable: "Keine Einträge verfügbar",
    loadingError: "Ladefehler.",
    contentLoadingError: "Ladefehler",
    initializationError: "Die Anwendung konnte nicht korrekt initialisiert werden.",
  },
  // Input placeholders
  input: {
    roleplay: (roleName) => `Nachricht an ${roleName}...`,
    transformation: "Eingabe...",
    transformationNext: "Deine neue Umformulierung...",
    transformationRestart: "Eingabe...",
    chooseScenario: "Wähle ein Szenario...",
    chooseExercise: "Wähle eine Übung...",
    allDone: "Alle Aufgaben erledigt.",
    retryOrContinue: "Versuche es noch einmal oder klicke auf 'Weiter'...",
  },
  // TTS Voice Labels
  tts: {
    userLabel: "Ich",
    briefingLabel: "Briefing",
  },
};

/**
 * Prompt templates for AI interactions.
 * Centralized for easier maintenance and consistency.
 */
export const PROMPT_TEMPLATES = {
  // Roleplay mode system prompts
  roleplay: {
    roleAdherence: "Verhalte dich konsequent gemäß deiner Rollenbeschreibung. Überlasse die Gesprächsführung und die Initiative dem Benutzer.",
    initialTopicGuidance: "Warte, bis der Benutzer das Thema des Gesprächs einführt, bevor du auf die Details deiner Rolle eingehst.",
    systemPrompt: (systemPrompt, partnerPrompt) =>
        `${systemPrompt}\n\n${partnerPrompt}`,
  },
  // Transformation mode prompts
  transformation: {
    userEvaluation: (statement, userVal) =>
        `Aufgabe: Formuliere die Aussage "${statement}" um.\n\nEingabe des Nutzers: "${userVal}"\n\nGib eine kurze, hilfreiche Rückmeldung (max. 2-3 Sätze) zu dieser spezifischen Umformulierung.`,
  },
};