import { $$ } from "basic-devtools";

import { getDetails } from "./script-handler.js";
import { registry, configs } from "./runtimes.js";
import { getRuntimeID } from "./loader.js";
import { io } from "./runtime/_utils.js";

export const PLUGINS_SELECTORS = [];

/**
 * @typedef {Object} Runtime plugin configuration
 * @prop {string} type the runtime type
 * @prop {object} runtime the bootstrapped runtime
 * @prop {(url:string, options?: object) => Worker} XWorker an XWorker constructor that defaults to same runtime on the Worker.
 * @prop {object} config a cloned config used to bootstrap the runtime
 * @prop {(code:string) => any} run an utility to run code within the runtime
 * @prop {(code:string) => Promise<any>} runAsync an utility to run code asynchronously within the runtime
 * @prop {(path:string, data:ArrayBuffer) => void} writeFile an utility to write a file in the virtual FS, if available
 */

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
/**
 * @param {Element} node any DOM element registered via plugin.
 */
export const handlePlugin = (node) => {
    for (const name of PLUGINS_SELECTORS) {
        if (node.matches(name)) {
            const { options, known } = plugins.get(name);
            if (!known.has(node)) {
                known.add(node);
                const { type, version, config, env, onRuntimeReady } = options;
                const name = getRuntimeID(type, version);
                const id = env || `${name}${config ? `|${config}` : ""}`;
                const { runtime: engine, XWorker } = getDetails(
                    type,
                    id,
                    name,
                    version,
                    config,
                );
                engine.then((runtime) => {
                    const module = registry.get(type);
                    onRuntimeReady(node, {
                        type,
                        runtime,
                        XWorker,
                        io: io.get(runtime),
                        config: structuredClone(configs.get(name)),
                        run: module.run.bind(module, runtime),
                        runAsync: module.runAsync.bind(module, runtime),
                    });
                });
            }
        }
    }
};

/**
 * @type {Map<string, {options:object, known:WeakSet<Element>}>}
 */
const plugins = new Map();

/**
 * @typedef {Object} PluginOptions plugin configuration
 * @prop {string} type the runtime/interpreter type to receive
 * @prop {string} [version] the optional runtime version to use
 * @prop {string} [config] the optional config to use within such runtime
 * @prop {string} [env] the optional environment to use
 * @prop {(node: Element, runtime: Runtime) => void} onRuntimeReady the callback that will be invoked once
 */

/**
 * Allows plugins and components on the page to receive runtimes to execute any code.
 * @param {string} name the unique plugin name
 * @param {PluginOptions} options the plugin configuration
 */
export const registerPlugin = (name, options) => {
    if (PLUGINS_SELECTORS.includes(name))
        throw new Error(`plugin ${name} already registered`);
    PLUGINS_SELECTORS.push(name);
    plugins.set(name, { options, known: new WeakSet() });
    $$(name).forEach(handlePlugin);
};
/* c8 ignore stop */
