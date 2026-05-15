/**
 * Utility functions for text parsing, formatting, and role detection.
 */

export const Utils = {
  appendText(container, text) {
    container.appendChild(document.createTextNode(text));
  },

  renderBoldMarkdownWithLineBreaks(container, text) {
    container.textContent = "";
    container.style.whiteSpace = "pre-wrap";

    // Very small markdown subset: **bold**
    const parts = String(text).split(/\*\*(.*?)\*\*/g);
    parts.forEach((part, index) => {
      if (!part) return;

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

  parseMetaValue(metaSection, key) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = metaSection.match(
      new RegExp(`^\\s*${escapedKey}:\\s*(.+)$`, "mi"),
    );
    return match?.[1].trim() || "";
  },

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
   * Attempts to extract the role name from the text or label.
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

  formatRoleName(name) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  },

  /**
   * Shuffles an array using the Fisher-Yates algorithm.
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
   * Generates a clean text transcript from chat history.
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
   * Formats a date for filenames (YYYY-MM-DD).
   */
  getFormattedDate() {
    return new Date().toISOString().slice(0, 10);
  },

  /**
   * Prepares text for speech output (removes markdown and stage directions).
   */
  cleanTextForSpeech(text) {
    return text
      .replace(/\*\*|\*/g, "") // Remove bold/italic markdown
      .replace(/\(.*?\)/g, "") // Remove (stage directions)
      .replace(/\[.*?\]/g, "") // Remove [stage directions]
      .replace(/\n\n+/g, ". ... . ") // Replace paragraphs with long pauses
      .replace(/:\s*\n/g, ". ... . ") // Replace colon at line end with pause
      .replace(/:\s*/g, ", ... ") // Replace colon in sentence with short pause
      .replace(/\n/g, ". ") // Replace simple line breaks with period
      .replace(/([.!?])\s+/g, "$1 ... ") // Small extra pause after punctuation
      .replace(/\s+/g, " ") // Clean up excess whitespace
      .trim();
  },
};
