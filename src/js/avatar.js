/**
 * Handles Avatar state, randomization, and animations (blinking/talking).
 * This module manages a multi-layered SVG/PNG character system.
 */

/**
 * Fallback transparent 1x1 GIF pixel to prevent broken image icons
 * when an avatar layer is missing.
 * @constant {string}
 */
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Order and naming of the image layers used for the avatar stack.
 * @constant {string[]}
 */
const LAYERS = [
  "body",
  "clothes",
  "hair",
  "glasses",
  "headset",
  "hands",
  "eyes",
  "mouth",
];

/**
 * The Avatar component manages the visual representation of the AI partner.
 * It handles the selection of character profiles, randomization of traits,
 * and coordinated animations for blinking and speaking.
 */
export const Avatar = {
  /** @type {Object} References to DOM image elements for main and mobile views */
  _nodes: {},

  /**
   * Internal state and current randomization indices.
   * @private
   */
  _state: {
    isTalking: false, // Whether the talking animation is active
    blinkTimeout: null, // Reference for the blinking loop timeout
    mouthInterval: null, // Reference for the mouth movement interval
    config: null, // The currently active character profile configuration
    current: {
      head: 0,
      clothes: 0,
      hair: 0,
      hands: 0,
      glasses: 0,
      headset: 0,
      eyes: 0,
      mouth: 0,
      skinTone: "a",
    },
  },

  /**
   * Preloads critical assets for a profile to prevent flickering during rendering.
   * @param {Object} profile - The character profile configuration.
   * @returns {Promise<void>} Resolves when essential layers are loaded.
   */
  async preloadProfile(profile) {
    if (!profile) return;

    const essentialPaths = [
      ...(profile.heads || []),
      ...(profile.clothes || []),
      ...(profile.hair || []),
      ...(profile.eyesOpen || []),
      ...(profile.mouthsClosed || []),
    ].map((p) => profile.basePath + p);

    const promises = essentialPaths.slice(0, 15).map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // Continue even if one fails
        img.src = src;
      });
    });

    return Promise.all(promises);
  },

  /**
   * Initializes the component with DOM node references.
   */
  init() {
    LAYERS.forEach((layer) => {
      this._nodes[layer] = document.querySelectorAll(
        `.js-avatar-layer[data-layer="${layer}"]`,
      );
    });
  },

  /**
   * Selects a profile and randomizes individual trait indices (hair, clothes, etc.).
   * Automatically triggers initial rendering and animation loops.
   * @param {Object|Array} data - A single character profile object or an array of profiles to pick from.
   * @returns {Promise<void>}
   */
  async setup(data) {
    if (!data) return;
    const profile = Array.isArray(data)
      ? data[Math.floor(Math.random() * data.length)]
      : data;

    // Vorherigen Charakter sofort ausblenden, um Flackern zu vermeiden
    this._state.config = null;
    this.update();

    // Optional: Preload before first update to avoid flickering
    await this.preloadProfile(profile);
    this._state.config = profile;

    const rand = (list) => Math.floor(Math.random() * (list?.length || 1));
    const s = this._state;
    const c = s.config;

    s.current.head = rand(c.heads);
    s.current.clothes = rand(c.clothes);
    s.current.hair = rand(c.hair);
    s.current.glasses = rand(c.glasses);
    s.current.headset = rand(c.headset);

    const headPath = c.heads?.[s.current.head] || "";
    const colorMatch = headPath.match(/_([a-d])\.png$/i);
    s.current.skinTone = colorMatch ? colorMatch[1].toLowerCase() : "a";

    const handPool = Array.isArray(c.hands)
      ? c.hands
      : c.hands[s.current.skinTone] || [""];
    s.current.hands = rand(handPool);
    s.current.eyes = rand(c.eyesOpen);
    s.current.mouth = rand(c.mouthsClosed);

    this.update();
    this._startBlinkLoop();
  },

  /**
   * Resolves the full URL for a specific layer based on current state and animation frame.
   * @param {string} layerName - Name of the layer (e.g., 'body', 'hair', 'eyes').
   * @param {boolean} [eyesClosed=false] - If true, resolves to the closed eyes graphic.
   * @param {boolean} [mouthOpen=false] - If true, resolves to the open mouth graphic.
   * @returns {string} The relative path to the image asset, or an empty string if not found.
   */
  getLayerSrc(layerName, eyesClosed = false, mouthOpen = false) {
    const s = this._state;
    if (!s.config) return "";

    let file = "";
    switch (layerName) {
      case "body":
        file = s.config.heads[s.current.head];
        break;
      case "clothes":
        file = s.config.clothes[s.current.clothes];
        break;
      case "hair":
        file = s.config.hair[s.current.hair];
        break;
      case "glasses":
        file = s.config.glasses[s.current.glasses];
        break;
      case "headset":
        file = s.config.headset?.[s.current.headset];
        break;
      case "hands":
        const pool = Array.isArray(s.config.hands)
          ? s.config.hands
          : s.config.hands[s.current.skinTone];
        file = pool[s.current.hands];
        break;
      case "eyes":
        file = (eyesClosed ? s.config.eyesClosed : s.config.eyesOpen)[
          s.current.eyes
        ];
        break;
      case "mouth":
        file = (mouthOpen ? s.config.mouthsOpen : s.config.mouthsClosed)[
          s.current.mouth
        ];
        break;
    }
    return file && file.trim() !== "" ? s.config.basePath + file : "";
  },

  /**
   * Updates the src attribute of all cached DOM image elements.
   * @param {boolean} [eyesClosed=false] - Animation state for the eyes.
   * @param {boolean} [mouthOpen=false] - Animation state for the mouth.
   * @returns {void}
   */
  update(eyesClosed = false, mouthOpen = false) {
    LAYERS.forEach((layer) => {
      const src =
        this.getLayerSrc(layer, eyesClosed, mouthOpen) || TRANSPARENT_PIXEL;
      const elements = this._nodes[layer];

      if (elements) {
        elements.forEach((img) => {
          img.src = src;
        });
      }
    });
  },

  /**
   * Toggles the speaking animation.
   * When active, sets an interval to toggle mouth states randomly.
   * @param {boolean} talking - Desired talking state.
   */
  setTalking(talking) {
    this._state.isTalking = talking;
    if (
      talking &&
      !this._state.mouthInterval &&
      this._state.config?.mouthsOpen
    ) {
      this._state.mouthInterval = setInterval(() => {
        this.update(false, Math.random() > 0.5);
      }, 150);
    } else if (!talking && this._state.mouthInterval) {
      clearInterval(this._state.mouthInterval);
      this._state.mouthInterval = null;
      this.update(false, false);
    }
  },

  /**
   * Starts the recursive timeout loop for the blinking animation.
   * Blinks are brief (150ms) and occur at random intervals between 2 and 6 seconds.
   * Respects current talking state to keep the mouth moving if necessary.
   * @private
   */
  _startBlinkLoop() {
    if (this._state.blinkTimeout) clearTimeout(this._state.blinkTimeout);
    const blink = () => {
      if (this._state.config?.eyesClosed)
        this.update(true, this._state.isTalking);
      setTimeout(() => {
        if (this._state.config?.eyesOpen)
          this.update(false, this._state.isTalking);
        this._state.blinkTimeout = setTimeout(
          blink,
          2000 + Math.random() * 4000,
        );
      }, 150);
    };
    blink();
  },

  /**
   * Returns the list of layer identifiers.
   * @returns {string[]}
   */
  getLayers() {
    return LAYERS;
  },

  /**
   * Returns the active character profile configuration.
   * @returns {Object|null}
   */
  getConfig() {
    return this._state.config;
  },
};
