/**
 * @module Utils
 * Provides stateless helper functions for text processing, Markdown rendering,
 * scenario parsing, and file management.
 */

export const Utils = {
  /**
   * Appends a plain text node to a DOM container.
   * @param {HTMLElement} container - The target DOM element.
   * @param {string} text - The text to append.
   */
  appendText(container, text) {
    container.appendChild(document.createTextNode(text));
  },

  /**
   * Renders a limited subset of Markdown (bolding via **) and preserves line breaks.
   * Uses 'pre-wrap' white-space styling for layout consistency.
   *
   * @param {HTMLElement} container - The target DOM element to clear and populate.
   * @param {string} text - The raw text containing potential Markdown patterns.
   */
  renderBoldMarkdownWithLineBreaks(container, text) {
    container.textContent = "";
    container.style.whiteSpace = "pre-wrap";

    // Very small Markdown subset: **bold**
    const parts = String(text).split(/\*\*(.*?)\*\*/g);
    parts.forEach((part, index) => {
      if (!part) return;

      // Odd indexes are the content captured inside the markers
      if (index % 2 === 1) {
        const strong = document.createElement("strong");
        strong.textContent = part;
        strong.className = "font-bold text-slate-900";
        container.appendChild(strong);
        return;
      }

      this.appendText(container, part);
    });
  },

  /**
   * Extracts a specific metadata value from a text block based on a key.
   *
   * @param {string} metaSection - The block of text containing key-value pairs.
   * @param {string} key - The key to look for (e.g., 'title').
   * @returns {string} The trimmed value or an empty string if not found.
   */
  parseMetaValue(metaSection, key) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = metaSection.match(
      new RegExp(`^\\s*${escapedKey}:\\s*(.+)$`, "mi"),
    );
    return match?.[1].trim() || "";
  },

  /**
   * Splits raw scenario text into metadata and instruction sections.
   *
   * @param {string} rawScenario - The raw string loaded from a scenario file.
   * @returns {{metaSection: string, instructionSection: string}}
   * @throws {Error} If the required separator '### GUI INSTRUCTION ###' is missing or section is empty.
   */
  parseScenarioContent(rawScenario) {
    const parts = rawScenario.split(/###\s*GUI INSTRUCTION\s*###/i);
    if (parts.length < 2) {
      throw new Error(
        "Szenarioformat ungültig: Marker '### GUI INSTRUCTION ###' fehlt.",
      );
    }

    const metaSection = parts[0];
    const instructionSection = parts
      .slice(1)
      .join("### GUI INSTRUCTION ###")
      .trim();

    if (!instructionSection) {
      throw new Error("Szenarioformat ungültig: GUI Instruction ist leer.");
    }

    return {
      metaSection,
      instructionSection,
    };
  },

  /**
   * Attempts to determine the partner's role name using heuristics and manual overrides.
   * Analyzes the 'Your Task' (Deine Aufgabe) section if no explicit label is provided.
   *
   * @param {string} instructionSection - The full briefing text.
   * @param {string} [roleLabel] - An optional explicit role label from metadata.
   * @returns {string} The normalized and formatted role name.
   */
  extractRoleName(instructionSection, roleLabel) {
    if (roleLabel) return this.formatRoleName(roleLabel);

    // Heuristic from "Your Task" section
    const taskSection =
      instructionSection.split(/Deine Aufgabe/i)[1] || instructionSection;
    const roleRegex = /mit\s+(?:der|dem|einem|einer)\s+([A-ZÄÖÜ][a-zäöüß]+)/i;
    const autoRoleMatch = taskSection.match(roleRegex);

    let roleName = "Teammitglied";
    if (autoRoleMatch) {
      roleName = autoRoleMatch[1].trim();
    } else {
      const fallbackRegex =
        /\b(?:ein|einen|eine|einem|einer)\s+([A-ZÄÖÜ][a-zäöüß]+)/;
      const fallbackMatch = taskSection.match(fallbackRegex);
      if (fallbackMatch) roleName = fallbackMatch[1].trim();
    }

    // Normalization
    if (
      roleName.toLowerCase().startsWith("mitarbeitend") &&
      !roleName.toLowerCase().endsWith("in")
    ) {
      roleName = "Mitarbeiter";
    }

    return this.formatRoleName(roleName);
  },

  /**
   * Standardizes role names to Title-case.
   * @param {string} name - The raw name string.
   * @returns {string}
   */
  formatRoleName(name) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  },

  /**
   * Generates a formatted plain-text transcript from the message history.
   * Skips 'system' role messages.
   *
   * @param {Array<{role: string, content: string}>} history - The chat history array.
   * @param {string} partnerRoleName - The display name used for assistant responses.
   * @returns {string} The double-newline separated transcript string.
   */
  generateTranscript(history, partnerRoleName) {
    return history
      .filter((m) => m.role !== "system")
      .map((m) => {
        const role = m.role === "user" ? "Führungskraft" : partnerRoleName;
        return `${role}: ${m.content}`;
      })
      .join("\n\n");
  },

  /**
   * Converts a string into a URL/filesystem-safe slug.
   * Removes special characters and replaces spaces with underscores.
   *
   * @param {string} text - The input string (e.g., a scenario title).
   * @returns {string} The sanitized string.
   */
  slugify(text) {
    if (!text) return "";
    return text
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "") // Keep alphanumeric, umlauts, and spaces
      .trim()
      .replace(/\s+/g, "_");
  },

  /**
   * Formats the current system date for use in filenames.
   * @returns {string} Date in YYYY-MM-DD format.
   */
  getFormattedDate() {
    return new Date().toISOString().slice(0, 10);
  },

  /**
   * Prepares text for Text-to-Speech by removing visual formatting and stage directions.
   * Injects artificial pauses (...) after punctuation for more natural delivery.
   *
   * @param {string} text - The raw chat or instruction text.
   * @returns {string} Cleaned text optimized for speech synthesis.
   */
  cleanTextForSpeech(text) {
    return text
      .replace(/\*\*|\*/g, "") // Removes bold/italic Markdown
      .replace(/\(.*?\)/g, "") // Removes (stage directions)
      .replace(/\[.*?\]/g, "") // Removes [stage directions]
      .replace(/\n\n+/g, ". ... . ") // Replaces paragraphs with long pauses
      .replace(/:\s*\n/g, ". ... . ") // Replaces colon at the end with a pause
      .replace(/:\s*/g, ", ... ") // Replaces colon in a sentence with a short pause
      .replace(/\n/g, ". ") // Replaces simple line breaks with a period
      .replace(/([.!?])\s+/g, "$1 ... ") // Adds a small extra pause after punctuation
      .replace(/\s+/g, " ") // Cleans up excess whitespace
      .trim();
  },

  /**
   * Triggers a browser download for a given string content.
   * @param {string} content - The text content to save.
   * @param {string} filename - The desired filename.
   * @param {string} [type='text/plain;charset=utf-8'] - MIME type.
   */
  downloadFile(content, filename, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  },
};
