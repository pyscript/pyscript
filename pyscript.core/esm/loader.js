import { runtime } from "./runtimes.js";
import { absoluteURL, resolve } from "./utils.js";
import { parse } from "./toml.js";
import { getJSON, getText } from "./fetch-utils.js";

/**
 * @param {string} id the runtime name @ version identifier
 * @param {string} [config] optional config file to parse
 * @returns
 */
export const getRuntime = (id, config) => {
    let options = {};
    if (config) {
        // REQUIRES INTEGRATION TEST
        /* c8 ignore start */
        if (config.endsWith(".json")) {
            options = fetch(config).then(getJSON);
        } else if (config.endsWith(".toml")) {
            options = fetch(config).then(getText).then(parse);
        } else {
            try {
                options = JSON.parse(config);
            } catch (_) {
                options = parse(config);
            }
            // make the config a URL to be able to retrieve relative paths from it
            config = absoluteURL("./config.txt");
        }
        /* c8 ignore stop */
    }
    return resolve(options).then((options) => runtime[id](options, config));
};

/**
 * @param {string} type the runtime type
 * @param {string} [version] the optional runtime version
 * @returns
 */
export const getRuntimeID = (type, version = "") =>
    `${type}@${version}`.replace(/@$/, "");
