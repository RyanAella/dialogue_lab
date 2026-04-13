/**
 * Hilfsfunktionen für Text-Parsing und Formatierung
 */

window.Utils = {
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
   * Versucht den Rollennamen aus dem Text oder dem Label zu extrahieren
   */
  extractRoleName(instructionSection, roleLabel) {
    if (roleLabel) return this.formatRoleName(roleLabel);

    // Heuristik aus "Deine Aufgabe" Sektion
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

    // Normalisierung
    if (roleName.toLowerCase().startsWith("mitarbeitend")) {
      roleName = "Mitarbeiter";
    }

    return this.formatRoleName(roleName);
  },

  formatRoleName(name) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  },
};
