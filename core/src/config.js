/**
 * This file parses a generic <py-config> or config attribute
 * to use as base config for all py-script elements, importing
 * also a queue of plugins *before* the interpreter (if any) resolves.
 */
import { $$ } from "basic-devtools";

import TYPES from "./types.js";
import allPlugins from "./plugins.js";
import { robustFetch as fetch, getText } from "./fetch.js";
import { ErrorCode } from "./exceptions.js";

const { BAD_CONFIG, CONFLICTING_CODE } = ErrorCode;

const badURL = (url, expected = "") => {
    let message = `(${BAD_CONFIG}): Invalid URL: ${url}`;
    if (expected) message += `\nexpected ${expected} content`;
    throw new Error(message);
};

/**
 * Given a string, returns its trimmed content as text,
 * fetching it from a file if the content is a URL.
 * @param {string} config either JSON, TOML, or a file to fetch
 * @param {string?} type the optional type to enforce
 * @returns {{json: boolean, toml: boolean, text: string}}
 */
const configDetails = async (config, type) => {
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

const conflictError = (reason) => new Error(`(${CONFLICTING_CODE}): ${reason}`);

const relative_url = (url, base = location.href) => new URL(url, base).href;

const syntaxError = (type, url, { message }) => {
    let str = `(${BAD_CONFIG}): Invalid ${type}`;
    if (url) str += ` @ ${url}`;
    return new SyntaxError(`${str}\n${message}`);
};

const configs = new Map();

for (const [TYPE] of TYPES) {
    /** @type {() => Promise<[...any]>} A Promise wrapping any plugins which should be loaded. */
    let plugins;

    /** @type {any} The PyScript configuration parsed from the JSON or TOML object*. May be any of the return types of JSON.parse() or toml-j0.4's parse() ( {number | string | boolean | null | object | Array} ) */
    let parsed;

    /** @type {Error | undefined} The error thrown when parsing the PyScript config, if any.*/
    let error;

    /** @type {string | undefined} The `configURL` field to normalize all config operations as opposite of guessing it once resolved */
    let configURL;

    let config,
        type,
        pyElement,
        pyConfigs = $$(`${TYPE}-config`),
        attrConfigs = $$(
            [
                `script[type="${TYPE}"][config]:not([worker])`,
                `${TYPE}-script[config]:not([worker])`,
            ].join(","),
        );

    // throw an error if there are multiple <py-config> or <mpy-config>
    if (pyConfigs.length > 1) {
        error = conflictError(`Too many ${TYPE}-config`);
    } else {
        // throw an error if there are <x-config> and config="x" attributes
        if (pyConfigs.length && attrConfigs.length) {
            error = conflictError(
                `Ambiguous ${TYPE}-config VS config attribute`,
            );
        } else if (pyConfigs.length) {
            [pyElement] = pyConfigs;
            config = pyElement.getAttribute("src") || pyElement.textContent;
            type = pyElement.getAttribute("type");
        } else if (attrConfigs.length) {
            [pyElement, ...attrConfigs] = attrConfigs;
            config = pyElement.getAttribute("config");
            // throw an error if dirrent scripts use different configs
            if (
                attrConfigs.some((el) => el.getAttribute("config") !== config)
            ) {
                error = conflictError(
                    "Unable to use different configs on main",
                );
            }
        }
    }

    // catch possible fetch errors
    if (!error && config) {
        try {
            const { json, toml, text, url } = await configDetails(config, type);
            if (url) configURL = relative_url(url);
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
                        /* webpackIgnore: true */ "./3rd-party/toml.js"
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
    plugins = async () => {
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
                toBeAwaited.push(value().then(({ default: p }) => p));
            } else if (key === "error") {
                toBeAwaited.push(value().then(({ notOnDOM }) => notOnDOM()));
            }
        }
        return await Promise.all(toBeAwaited);
    };

    configs.set(TYPE, { config: parsed, configURL, plugins, error });
}

export { configs, relative_url };
