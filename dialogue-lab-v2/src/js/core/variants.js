/**
 * @module Variants
 * Centralized configuration for different application variants (practice, simulation, default).
 * Supports both hash-based routing (for local development) and path-based routing (for production).
 */

/**
 * Variant configurations for different deployment paths.
 * Each variant can define:
 * - hash: Hash identifier for local development (e.g., #practice)
 * - pathPattern: URL path to match for production (e.g., /practice-edition/)
 * - exercisesFilter: Function to filter exercises (returns true to include)
 * - modes: Array of allowed application modes
 */
export const VARIANT_CONFIGS = {
  practice: {
    hash: 'practice',
    pathPattern: '/dialogue-lab-v2/practice-edition',
    exercisesFilter: (ex) => ex.type === "TRANSFORMATION",
    modes: ["transformation"]
  },
  simulation: {
    hash: 'simulation',
    pathPattern: '/dialogue-lab-v2/simulation-lab',
    exercisesFilter: (ex) => ex.type === "SIMULATION",
    modes: ["simulation"]
  },
  default: {
    hash: '',
    pathPattern: '/dialogue-lab-v2/',
    exercisesFilter: null,
    modes: ["simulation", "transformation"]
  }
};

/**
 * Detects the current variant based on URL hash (for local development with VS Code/WebStorm)
 * or pathname (for production on GitHub Pages).
 * Returns the matching variant configuration or the default if no match is found.
 */
export const CURRENT_VARIANT = (() => {
  // 1. Check hash first (for local development with VS Code/WebStorm)
  // Extract only the hash part, remove any query parameters added by IDE
  const hash = window.location.hash.split('#')[1]?.split('?')[0] || '';
  
  // Only check hash if it's not empty (non-default variants have explicit hash values)
  if (hash) {
    for (const [key, config] of Object.entries(VARIANT_CONFIGS)) {
      if (hash === config.hash) {
        return { ...config, id: key };
      }
    }
  }

  // 2. Check path (for production on GitHub Pages)
  const path = window.location.pathname;
  
  // Check patterns in order: practice, simulation, then default
  for (const [key, config] of Object.entries(VARIANT_CONFIGS)) {
    if (config.pathPattern && path.includes(config.pathPattern)) {
      return { ...config, id: key };
    }
  }

  // If no pattern matched, return default
  return VARIANT_CONFIGS.default;
})();


