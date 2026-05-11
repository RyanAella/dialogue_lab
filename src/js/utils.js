/**
 * Utility functions for text parsing, formatting, and role detection.
 */

export const Utils = {
  /**
   * Safely appends a text node to a container element.
   * @param {HTMLElement} container - The element to append text to.
   * @param {string} text - The text to append.
   */
  appendText(container, text) {
    container.appendChild(document.createTextNode(text));
  },

  /**
   * Renders a subset of Markdown (bolding) and preserves whitespace/line breaks.
   * @param {HTMLElement} container - The target element for rendering.
   * @param {string} text - The raw text containing **bold** markers.
   */
  renderBoldMarkdownWithLineBreaks(container, text) {
    container.textContent = "";
    container.style.whiteSpace = "pre-wrap";

    // Split text by bold markers (**text**)
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
   * Extracts a specific value from a meta section string based on a key (e.g., "title: Value").
   * @param {string} metaSection - The text block containing metadata.
   * @param {string} key - The metadata key to search for.
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
   * Splits a raw scenario/instruction file into Meta and GUI Instruction sections.
   * @param {string} rawScenario - The raw content of the .txt file.
   * @returns {Object} An object containing metaSection and instructionSection strings.
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
   * Attempts to extract the role name from the text or the label.
   * @param {string} instructionSection - The briefing text.
   * @param {string} roleLabel - Explicit role label from meta.
   * @returns {string} The formatted role name.
   */
  extractRoleName(instructionSection, roleLabel) {
    if (roleLabel) return this.formatRoleName(roleLabel);

    // Heuristic: search after "Deine Aufgabe" (Your Task) section
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

    // Normalization for common German terms
    if (
      roleName.toLowerCase().startsWith("mitarbeitend") &&
      !roleName.toLowerCase().endsWith("in")
    ) {
      roleName = "Mitarbeiter";
    }

    return this.formatRoleName(roleName);
  },

  /**
   * Capitalizes the first letter and lowers the rest.
   */
  formatRoleName(name) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  },

  /**
   * Randomizes the order of elements in an array using the Fisher-Yates algorithm.
   * @param {Array} array - The array to shuffle.
   * @returns {Array} A new shuffled array.
   */
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },
  /**
   * Generates a clean text transcript from chat history
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
   * Formats a date for filenames (YYYY-MM-DD)
   */
  getFormattedDate() {
    return new Date().toISOString().slice(0, 10);
  },

  /**
   * Prepares text for speech output (removes Markdown and stage directions).
   */
  cleanTextForSpeech(text) {
    return text
      .replace(/\*\*|\*/g, "") // Remove bold/italic Markdown
      .replace(/\(.*?\)/g, "") // Remove (stage directions)
      .replace(/\[.*?\]/g, "") // Remove [stage directions]
      .replace(/\n\n+/g, ". ... . ") // Replace paragraphs with long pauses
      .replace(/:\s*\n/g, ". ... . ") // Replace trailing colon with pause
      .replace(/:\s*/g, ", ... ") // Replace inline colon with short pause
      .replace(/\n/g, ". ") // Replace simple line breaks with period
      .replace(/([.!?])\s+/g, "$1 ... ") // Add tiny extra pause after punctuation
      .replace(/\s+/g, " ") // Clean up excess whitespace
      .trim();
  },
};
