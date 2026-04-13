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
};
