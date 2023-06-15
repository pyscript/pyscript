import { $$ } from "basic-devtools";

import { create } from "./utils.js";
import { getDetails } from "./script-handler.js";
import { registry, configs } from "./interpreters.js";
import { getRuntimeID } from "./loader.js";
import { io } from "./interpreter/_utils.js";

import workerHooks from "./worker/hooks.js";

export const PLUGINS_SELECTORS = [];

/**
 * @typedef {Object} Runtime plugin configuration
 * @prop {string} type the interpreter type
 * @prop {object} interpreter the bootstrapped interpreter
 * @prop {(url:string, options?: object) => Worker} XWorker an XWorker constructor that defaults to same interpreter on the Worker.
 * @prop {object} config a cloned config used to bootstrap the interpreter
 * @prop {(code:string) => any} run an utility to run code within the interpreter
 * @prop {(code:string) => Promise<any>} runAsync an utility to run code asynchronously within the interpreter
 * @prop {(path:string, data:ArrayBuffer) => void} writeFile an utility to write a file in the virtual FS, if available
 */

const patched = new Map();

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
                const { interpreter: engine, XWorker } = getDetails(
                    type,
                    id,
                    name,
                    version,
                    config,
                );
                engine.then((interpreter) => {
                    if (!patched.has(id)) {
                        const module = create(registry.get(type));
                        const {
                            onBeforeRun,
                            onBeforeRunAsync,
                            onAfterRun,
                            onAfterRunAsync,
                            codeBeforeRunWorker,
                            codeBeforeRunWorkerAsync,
                            codeAfterRunWorker,
                            codeAfterRunWorkerAsync,
                        } = options;

                        // These two loops mimic a `new Map(arrayContent)` without needing
                        // the new Map overhead so that [name, [before, after]] can be easily destructured
                        // and new sync or async patches become easy to add (when the logic is the same).

                        // patch sync
                        for (const [name, [before, after]] of [
                            ["run", [onBeforeRun, onAfterRun]],
                        ]) {
                            const method = module[name];
                            module[name] = function (interpreter, code) {
                                if (before) before.call(this, resolved, node);
                                const result = method.call(
                                    this,
                                    interpreter,
                                    code,
                                );
                                if (after) after.call(this, resolved, node);
                                return result;
                            };
                        }

                        // patch async
                        for (const [name, [before, after]] of [
                            ["runAsync", [onBeforeRunAsync, onAfterRunAsync]],
                        ]) {
                            const method = module[name];
                            module[name] = async function (interpreter, code) {
                                if (before)
                                    await before.call(this, resolved, node);
                                const result = await method.call(
                                    this,
                                    interpreter,
                                    code,
                                );
                                if (after)
                                    await after.call(this, resolved, node);
                                return result;
                            };
                        }

                        // setup XWorker hooks, allowing strings to be forwarded to the worker
                        // whenever it's created, as functions can't possibly be serialized
                        // unless these are pure with no outer scope access (or globals vars)
                        // so that making it strings disambiguate about their running context.
                        workerHooks.set(XWorker, {
                            beforeRun: codeBeforeRunWorker,
                            beforeRunAsync: codeBeforeRunWorkerAsync,
                            afterRun: codeAfterRunWorker,
                            afterRunAsync: codeAfterRunWorkerAsync,
                        });

                        const resolved = {
                            type,
                            interpreter,
                            XWorker,
                            io: io.get(interpreter),
                            config: structuredClone(configs.get(name)),
                            run: module.run.bind(module, interpreter),
                            runAsync: module.runAsync.bind(module, interpreter),
                        };

                        patched.set(id, resolved);
                    }

                    onRuntimeReady(patched.get(id), node);
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
 * @prop {string} type the interpreter/interpreter type to receive
 * @prop {string} [version] the optional interpreter version to use
 * @prop {string} [config] the optional config to use within such interpreter
 * @prop {string} [env] the optional environment to use
 * @prop {(node: Element, interpreter: Runtime) => void} onRuntimeReady the callback that will be invoked once
 */

/**
 * Allows plugins and components on the page to receive interpreters to execute any code.
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
