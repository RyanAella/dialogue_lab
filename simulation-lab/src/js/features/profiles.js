/**
 * @module Profiles
 * Defines character asset pools and maps them to specific dialogue roles.
 * This file manages the visual configurations for all AI partners, including
 * layered image paths for heads, clothes, hair, and accessories.
 */

import {
  FEMALE_CHARACTERS,
  MALE_CHARACTERS,
  ALL_CHARACTERS
} from "../../data/characters.js";

/**
 * Maps scenario role labels to specific character pools.
 * The key corresponds to the 'role_label' or 'roleName' defined in the scenario text files.
 * @type {Object.<string, CharacterProfile[]>}
 */
export const CHARACTER_PROFILES = {
  // Role assignments
  Mitarbeiterin: FEMALE_CHARACTERS,
  Kollegin: FEMALE_CHARACTERS,
  Mitarbeiter: MALE_CHARACTERS,
  Kollege: MALE_CHARACTERS,
  Teammitglied: MALE_CHARACTERS,
  Coach: ALL_CHARACTERS,

  // Fallback
  default: ALL_CHARACTERS,
};

/**
 * Retrieves the appropriate character profile pool based on a role key.
 * Falls back to the global 'default' pool if the key is not found.
 * @param {string} key - The role name or label to look up.
 * @returns {CharacterProfile[]} An array of character profiles matching the role.
 */
export const getProfilePool = (key) => {
  return CHARACTER_PROFILES[key] || CHARACTER_PROFILES["default"];
};
