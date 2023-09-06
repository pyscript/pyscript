import "@ungap/with-resolvers";
import { $ } from "basic-devtools";
import { define, XWorker } from "polyscript";
import { htmlDecode } from "./utils.js";
import sync from "./sync.js";

import stdlib from "./stdlib.js";

// TODO: this is not strictly polyscript related but handy ... not sure
//       we should factor this utility out a part but this works anyway.
import { queryTarget } from "../node_modules/polyscript/esm/script-handler.js";
import { Hook } from "../node_modules/polyscript/esm/worker/hooks.js";

import { robustFetch as fetch } from "./fetch.js";

const { assign, defineProperty } = Object;

const getText = (body) => body.text();

// allows lazy element features on code evaluation
let currentElement;

// create a unique identifier when/if needed
let id = 0;
const getID = (prefix = "py") => `${prefix}-${id++}`;

// find the shared config for all py-script elements
let config;
let pyConfig = $("py-config");
if (pyConfig) config = pyConfig.getAttribute("src") || pyConfig.textContent;
else {
    pyConfig = $('script[type="py"]');
    config = pyConfig?.getAttribute("config");
}

if (/^https?:\/\//.test(config)) config = await fetch(config).then(getText);

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

    if (asText) return tag.textContent;

    console.warn(
        'Deprecated: use <script type="py"> for an always safe content parsing:\n',
        tag.innerHTML,
    );

    return htmlDecode(tag.innerHTML);
};

// common life-cycle handlers for any node
const bootstrapNodeAndPlugins = (pyodide, element, callback, hook) => {
    if (isScript(element)) callback(element);
    for (const fn of hooks[hook]) fn(pyodide, element);
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
    interpreter.registerJsModule("_pyscript_js", {
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
    onBeforeRunAync: new Set(),
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
        [stdlib, ...hooks.codeBeforeRunWorker].join("\n"),
    codeBeforeRunWorkerAsync: () =>
        [stdlib, ...hooks.codeBeforeRunWorkerAsync].join("\n"),
    codeAfterRunWorker: () => [...hooks.codeAfterRunWorker].join("\n"),
    codeAfterRunWorkerAsync: () =>
        [...hooks.codeAfterRunWorkerAsync].join("\n"),
};

// define the module as both `<script type="py">` and `<py-script>`
define("py", {
    config,
    env: "py-script",
    interpreter: "pyodide",
    ...workerHooks,
    onWorkerReady(_, xworker) {
        assign(xworker.sync, sync);
    },
    onBeforeRun(pyodide, element) {
        currentElement = element;
        bootstrapNodeAndPlugins(pyodide, element, before, "onBeforeRun");
    },
    onBeforeRunAync(pyodide, element) {
        currentElement = element;
        bootstrapNodeAndPlugins(pyodide, element, before, "onBeforeRunAync");
    },
    onAfterRun(pyodide, element) {
        bootstrapNodeAndPlugins(pyodide, element, after, "onAfterRun");
    },
    onAfterRunAsync(pyodide, element) {
        bootstrapNodeAndPlugins(pyodide, element, after, "onAfterRunAsync");
    },
    async onInterpreterReady(pyodide, element) {
        if (shouldRegister) {
            shouldRegister = false;
            registerModule(pyodide);
        }
        // allows plugins to do whatever they want with the element
        // before regular stuff happens in here
        for (const callback of hooks.onInterpreterReady)
            callback(pyodide, element);
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

            pyodide[`run${isAsync ? "Async" : ""}`](
                await fetchSource(element, pyodide.io, true),
            );
        } else {
            // resolve PyScriptElement to allow connectedCallback
            element._pyodide.resolve(pyodide);
        }
        console.debug("[pyscript/main] PyScript Ready");
    },
});

class PyScriptElement extends HTMLElement {
    constructor() {
        assign(super(), {
            _pyodide: Promise.withResolvers(),
            srcCode: "",
            executed: false,
        });
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
            const { io, run, runAsync } = await this._pyodide.promise;
            const runner = this.hasAttribute("async") ? runAsync : run;
            this.srcCode = await fetchSource(this, io, !this.childElementCount);
            this.replaceChildren();
            runner(this.srcCode);
            this.style.display = "block";
        }
    }
}

customElements.define("py-script", PyScriptElement);

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
