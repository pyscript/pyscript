/*! (c) PyScript Development Team */

import "@ungap/with-resolvers";
import { INVALID_CONTENT, define, XWorker } from "polyscript";

// TODO: this is not strictly polyscript related but handy ... not sure
//       we should factor this utility out a part but this works anyway.
import { queryTarget } from "../node_modules/polyscript/esm/script-handler.js";
import { dedent, dispatch } from "../node_modules/polyscript/esm/utils.js";
import { Hook } from "../node_modules/polyscript/esm/worker/hooks.js";

import { ErrorCode } from "./exceptions.js";
import sync from "./sync.js";
import stdlib from "./stdlib.js";
import { config, plugins, error } from "./config.js";
import { robustFetch as fetch, getText } from "./fetch.js";

const { assign, defineProperty } = Object;

// allows lazy element features on code evaluation
let currentElement;

const TYPES = new Map([
    ["py", "pyodide"],
    ["mpy", "micropython"],
]);

// generic helper to disambiguate between custom element and script
const isScript = ({ tagName }) => tagName === "SCRIPT";

// helper for all script[type="py"] out there
const before = (script) => {
    defineProperty(document, "currentScript", {
        configurable: true,
        get: () => script,
    });
};

const after = () => {
    delete document.currentScript;
};

// common life-cycle handlers for any node
const bootstrapNodeAndPlugins = (wrap, element, callback, hook) => {
    // make it possible to reach the current target node via Python
    callback(element);
    for (const fn of hooks[hook]) fn(wrap, element);
};

let shouldRegister = true;
const registerModule = ({ XWorker: $XWorker, interpreter, io }) => {
    // automatically use the pyscript stderr (when/if defined)
    // this defaults to console.error
    function PyWorker(...args) {
        const worker = $XWorker(...args);
        worker.onerror = ({ error }) => io.stderr(error);
        return worker;
    }

    // enrich the Python env with some JS utility for main
    interpreter.registerJsModule("_pyscript", {
        PyWorker,
        get target() {
            return isScript(currentElement)
                ? currentElement.target.id
                : currentElement.id;
        },
    });

    interpreter.runPython(stdlib, { globals: interpreter.runPython("{}") });
};

export const hooks = {
    /** @type {Set<function>} */
    onBeforeRun: new Set(),
    /** @type {Set<function>} */
    onBeforeRunAsync: new Set(),
    /** @type {Set<function>} */
    onAfterRun: new Set(),
    /** @type {Set<function>} */
    onAfterRunAsync: new Set(),
    /** @type {Set<function>} */
    onInterpreterReady: new Set(),

    /** @type {Set<string>} */
    codeBeforeRunWorker: new Set(),
    /** @type {Set<string>} */
    codeBeforeRunWorkerAsync: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorker: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorkerAsync: new Set(),
};

const workerHooks = {
    codeBeforeRunWorker: () =>
        [stdlib, ...hooks.codeBeforeRunWorker].map(dedent).join("\n"),
    codeBeforeRunWorkerAsync: () =>
        [stdlib, ...hooks.codeBeforeRunWorkerAsync].map(dedent).join("\n"),
    codeAfterRunWorker: () =>
        [...hooks.codeAfterRunWorker].map(dedent).join("\n"),
    codeAfterRunWorkerAsync: () =>
        [...hooks.codeAfterRunWorkerAsync].map(dedent).join("\n"),
};

for (const [TYPE, interpreter] of TYPES) {
    // create a unique identifier when/if needed
    let id = 0;
    const getID = (prefix = TYPE) => `${prefix}-${id++}`;

    /**
     * Given a generic DOM Element, tries to fetch the 'src' attribute, if present.
     * It either throws an error if the 'src' can't be fetched or it returns a fallback
     * content as source.
     */
    const fetchSource = async (tag, io, asText) => {
        if (tag.hasAttribute("src")) {
            try {
                return await fetch(tag.getAttribute("src")).then(getText);
            } catch (error) {
                io.stderr(error);
            }
        }

        if (asText) return dedent(tag.textContent);

        console.warn(
            `Deprecated: use <script type="${TYPE}"> for an always safe content parsing:\n`,
            tag.innerHTML,
        );

        return dedent(tag.innerHTML);
    };

    // define the module as both `<script type="py">` and `<py-script>`
    // but only if the config didn't throw an error
    if (!error) {
        // possible early errors sent by polyscript
        const errors = new Map();

        define(TYPE, {
            config,
            interpreter,
            env: `${TYPE}-script`,
            onerror(error, element) {
                errors.set(element, error);
            },
            ...workerHooks,
            onWorkerReady(_, xworker) {
                assign(xworker.sync, sync);
            },
            onBeforeRun(wrap, element) {
                currentElement = element;
                bootstrapNodeAndPlugins(wrap, element, before, "onBeforeRun");
            },
            onBeforeRunAsync(wrap, element) {
                currentElement = element;
                bootstrapNodeAndPlugins(
                    wrap,
                    element,
                    before,
                    "onBeforeRunAsync",
                );
            },
            onAfterRun(wrap, element) {
                bootstrapNodeAndPlugins(wrap, element, after, "onAfterRun");
            },
            onAfterRunAsync(wrap, element) {
                bootstrapNodeAndPlugins(
                    wrap,
                    element,
                    after,
                    "onAfterRunAsync",
                );
            },
            async onInterpreterReady(wrap, element) {
                if (shouldRegister) {
                    shouldRegister = false;
                    registerModule(wrap);
                }

                // ensure plugins are bootstrapped already
                if (plugins) await plugins;

                // allows plugins to do whatever they want with the element
                // before regular stuff happens in here
                for (const callback of hooks.onInterpreterReady)
                    callback(wrap, element);

                // now that all possible plugins are configured,
                // bail out if polyscript encountered an error
                if (errors.has(element)) {
                    let { message } = errors.get(element);
                    errors.delete(element);
                    const clone = message === INVALID_CONTENT;
                    message = `(${ErrorCode.CONFLICTING_CODE}) ${message} for `;
                    message += element.cloneNode(clone).outerHTML;
                    wrap.io.stderr(message);
                    return;
                }

                if (isScript(element)) {
                    const {
                        attributes: { async: isAsync, target },
                    } = element;
                    const hasTarget = !!target?.value;
                    const show = hasTarget
                        ? queryTarget(target.value)
                        : document.createElement("script-py");

                    if (!hasTarget) {
                        const { head, body } = document;
                        if (head.contains(element)) body.append(show);
                        else element.after(show);
                    }
                    if (!show.id) show.id = getID();

                    // allows the code to retrieve the target element via
                    // document.currentScript.target if needed
                    defineProperty(element, "target", { value: show });

                    // notify before the code runs
                    dispatch(element, TYPE);
                    wrap[`run${isAsync ? "Async" : ""}`](
                        await fetchSource(element, wrap.io, true),
                    );
                } else {
                    // resolve PyScriptElement to allow connectedCallback
                    element._wrap.resolve(wrap);
                }
                console.debug("[pyscript/main] PyScript Ready");
            },
        });
    }

    class PyScriptElement extends HTMLElement {
        constructor() {
            assign(super(), {
                _wrap: Promise.withResolvers(),
                srcCode: "",
                executed: false,
            });
        }
        get _pyodide() {
            // TODO: deprecate this hidden attribute already
            //       currently used by integration tests
            return this._wrap;
        }
        get id() {
            return super.id || (super.id = getID());
        }
        set id(value) {
            super.id = value;
        }
        async connectedCallback() {
            if (!this.executed) {
                this.executed = true;
                const { io, run, runAsync } = await this._wrap.promise;
                const runner = this.hasAttribute("async") ? runAsync : run;
                this.srcCode = await fetchSource(
                    this,
                    io,
                    !this.childElementCount,
                );
                this.replaceChildren();
                // notify before the code runs
                dispatch(this, TYPE);
                runner(this.srcCode);
                this.style.display = "block";
            }
        }
    }

    // define py-script only if the config didn't throw an error
    if (!error) customElements.define(`${TYPE}-script`, PyScriptElement);
}

// TBD: I think manual worker cases are interesting in pyodide only
//      so for the time being we should be fine with this export.

/**
 * A `Worker` facade able to bootstrap on the worker thread only a PyScript module.
 * @param {string} file the python file to run ina worker.
 * @param {{config?: string | object, async?: boolean}} [options] optional configuration for the worker.
 * @returns {Worker & {sync: ProxyHandler<object>}}
 */
export function PyWorker(file, options) {
    // this propagates pyscript worker hooks without needing a pyscript
    // bootstrap + it passes arguments and enforces `pyodide`
    // as the interpreter to use in the worker, as all hooks assume that
    // and as `pyodide` is the only default interpreter that can deal with
    // all the features we need to deliver pyscript out there.
    const xworker = XWorker.call(new Hook(null, workerHooks), file, {
        ...options,
        type: "pyodide",
    });
    assign(xworker.sync, sync);
    return xworker;
}
