/**
 * @fileoverview Input validation helpers for query parameters.
 * Ensures numeric inputs are valid, strings are sanitized, and defaults are applied.
 */

/**
 * Parse and validate an integer query parameter.
 * @param {string} value - Raw query parameter value
 * @param {number} defaultVal - Default if missing or invalid
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated integer
 */
function parseIntParam(value, defaultVal, min = 1, max = 10000) {
  if (value === undefined || value === null || value === '') return defaultVal;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultVal;
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Parse and validate a decimal query parameter.
 * @param {string} value - Raw query parameter value
 * @param {number} defaultVal - Default if missing or invalid
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated decimal
 */
function parseFloatParam(value, defaultVal, min = 0, max = 500) {
  if (value === undefined || value === null || value === '') return defaultVal;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return defaultVal;
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Parse a string query parameter, returning null if empty.
 * @param {string} value - Raw query parameter value
 * @returns {string|null} Trimmed string or null
 */
function parseStringParam(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim();
}

module.exports = { parseIntParam, parseFloatParam, parseStringParam };
