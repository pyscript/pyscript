/**
 * This file parses a generic <py-config> or config attribute
 * to use as base config for all py-script elements, importing
 * also a queue of plugins *before* the interpreter (if any) resolves.
 */
import { $ } from "basic-devtools";

import allPlugins from "./plugins.js";
import { robustFetch as fetch, getText } from "./fetch.js";
import { ErrorCode } from "./exceptions.js";

const badURL = (url, expected = "") => {
    let message = `(${ErrorCode.BAD_CONFIG}): Invalid URL: ${url}`;
    if (expected) message += `\nexpected ${expected} content`;
    throw new Error(message);
};

/**
 * Given a string, returns its trimmed content as text,
 * fetching it from a file if the content is a URL.
 * @param {string} config either JSON, TOML, or a file to fetch
 * @returns {{json: boolean, toml: boolean, text: string}}
 */
const configDetails = async (config) => {
    let text = config?.trim();
    // we only support an object as root config
    let url = "",
        toml = false,
        json = /^{/.test(text) && /}$/.test(text);
    // handle files by extension (relaxing urls parts after)
    if (!json && /\.(\w+)(?:\?\S*)?$/.test(text)) {
        const ext = RegExp.$1;
        if (ext === "json" && type !== "toml") json = true;
        else if (ext === "toml" && type !== "json") toml = true;
        else badURL(text, type);
        url = text;
        text = (await fetch(url).then(getText)).trim();
    }
    return { json, toml: toml || (!json && !!text), text, url };
};

const syntaxError = (type, url, { message }) => {
    let str = `(${ErrorCode.BAD_CONFIG}): Invalid ${type}`;
    if (url) str += ` @ ${url}`;
    return new SyntaxError(`${str}\n${message}`);
};

// find the shared config for all py-script elements
let config, plugins, parsed, error, type;
let pyConfig = $("py-config");
if (pyConfig) {
    config = pyConfig.getAttribute("src") || pyConfig.textContent;
    type = pyConfig.getAttribute("type");
} else {
    pyConfig = $(
        [
            'script[type="py"][config]:not([worker])',
            "py-script[config]:not([worker])",
        ].join(","),
    );
    if (pyConfig) config = pyConfig.getAttribute("config");
}

// catch possible fetch errors
if (config) {
    try {
        const { json, toml, text, url } = await configDetails(config);
        config = text;
        if (json || type === "json") {
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                error = syntaxError("JSON", url, e);
            }
        } else if (toml || type === "toml") {
            try {
                const { parse } = await import(
                    /* webpackIgnore: true */
                    "https://cdn.jsdelivr.net/npm/@webreflection/toml-j0.4/toml.js"
                );
                parsed = parse(text);
            } catch (e) {
                error = syntaxError("TOML", url, e);
            }
        }
    } catch (e) {
        error = e;
    }
}

// parse all plugins and optionally ignore only
// those flagged as "undesired" via `!` prefix
const toBeAwaited = [];
for (const [key, value] of Object.entries(allPlugins)) {
    if (error) {
        if (key === "error") {
            // show on page the config is broken, meaning that
            // it was not possible to disable error plugin neither
            // as that part wasn't correctly parsed anyway
            value().then(({ notify }) => notify(error.message));
        }
    } else if (!parsed?.plugins?.includes(`!${key}`)) {
        toBeAwaited.push(value());
    }
}

// assign plugins as Promise.all only if needed
if (toBeAwaited.length) plugins = Promise.all(toBeAwaited);

export { parsed as config, plugins, error };
