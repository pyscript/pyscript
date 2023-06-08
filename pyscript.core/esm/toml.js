// lazy TOML parser (fast-toml might be a better alternative)
const TOML_LIB = `https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js`;

/**
 * @param {string} text TOML text to parse
 * @returns {object} the resulting JS object
 */
export const parse = async (text) => (await import(TOML_LIB)).parse(text);
