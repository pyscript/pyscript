/**
 * This file parses a generic <py-config> or config attribute
 * to use as base config for all py-script elements, importing
 * also a queue of plugins *before* the interpreter (if any) resolves.
 */
import { $ } from "basic-devtools";

import allPlugins from "./plugins.js";
import { robustFetch as fetch, getText } from "./fetch.js";

// TODO: this is not strictly polyscript related but handy ... not sure
//       we should factor this utility out a part but this works anyway.
import { parse } from "../node_modules/polyscript/esm/toml.js";

// find the shared config for all py-script elements
let config, plugins, parsed;
let pyConfig = $("py-config");
if (pyConfig) config = pyConfig.getAttribute("src") || pyConfig.textContent;
else {
    pyConfig = $('script[type="py"][config]');
    if (pyConfig) config = pyConfig.getAttribute("config");
}

// load its content if remote
if (/^https?:\/\//.test(config)) config = await fetch(config).then(getText);

// parse config only if not empty
if (config?.trim()) {
    try {
        parsed = JSON.parse(config);
    } catch (_) {
        parsed = await parse(config);
    }
}

// parse all plugins and optionally ignore only
// those flagged as "undesired" via `!` prefix
const toBeAwaited = [];
for (const [key, value] of Object.entries(allPlugins)) {
    if (!parsed?.plugins?.includes(`!${key}`)) toBeAwaited.push(value());
}
if (toBeAwaited.length) plugins = Promise.all(toBeAwaited);

export { config, plugins };
