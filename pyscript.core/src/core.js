import "@ungap/with-resolvers";
import { $ } from "basic-devtools";
import { define, XWorker } from "polyscript";

// TODO: this is not strictly polyscript related but handy ... not sure
//       we should factor this utility out a part but this works anyway.
import { queryTarget } from "../node_modules/polyscript/esm/script-handler.js";
import { Hook } from "../node_modules/polyscript/esm/worker/hooks.js";

import { robustFetch as fetch } from "./fetch.js";

const { defineProperty } = Object;

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
const isScript = (element) => element.tagName === "SCRIPT";

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
const fetchSource = async (tag, io) => {
    if (tag.hasAttribute("src")) {
        try {
            return await fetch(tag.getAttribute("src")).then(getText);
        } catch (error) {
            io.stderr(error);
        }
    }
    return tag.textContent;
};

// common life-cycle handlers for any node
const bootstrapNodeAndPlugins = (pyodide, element, callback, hook) => {
    if (isScript(element)) callback(element);
    for (const fn of hooks[hook]) fn(pyodide, element);
};

// these are imported as string (via rollup)
import init_py from "./stdlib/_pyscript/__init__.py";
import display_py from "./stdlib/_pyscript/_display.py";

const writeStdlib = (pyodide, element) => {
    console.log("writeStdlib!");
    const FS = pyodide.interpreter.FS;
    FS.mkdirTree("/home/pyodide/_pyscript");
    FS.writeFile("_pyscript/__init__.py", init_py, { encoding: "utf8" });
    FS.writeFile("_pyscript/_display.py", display_py, { encoding: "utf8" });
};

const registerModule = ({ XWorker: $XWorker, interpreter, io }) => {
    // automatically use the pyscript stderr (when/if defined)
    // this defaults to console.error
    function PyWorker(...args) {
        const worker = $XWorker(...args);
        worker.onerror = ({ error }) => io.stderr(error);
        return worker;
    }
    // trap once the python `display` utility (borrowed from "classic PyScript")
    // provide the regular Pyodide globals instead of those from xworker
    // const pyDisplay = interpreter.runPython(
    //     [
    //         "import js",
    //         "document=js.document",
    //         "window=js",
    //         display,
    //         "display",
    //     ].join("\n"),
    // );
    const pyDisplay = interpreter.runPython(`
from _pyscript import display
display
`);

    interpreter.registerJsModule("pyscript", {
        PyWorker,
        document,
        window,
        // a getter to ensure if multiple scripts with same
        // env (py) runs, their execution code will have the correct
        // display reference with automatic target
        get display() {
            const id = isScript(currentElement)
                ? currentElement.target.id
                : currentElement.id;

            return (...args) => {
                const last = args.at(-1);
                let kw = { target: id, append: false };
                if (
                    typeof last === "object" &&
                    last &&
                    ("target" in last || "append" in last)
                )
                    kw = { ...kw, ...args.pop() };
                pyDisplay.callKwargs(...args, kw);
            };
        },
    });
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

// XXX antocuni: I think this is broken, because now _display.py imports
// window and document directly from js
const workerPyScriptModule = [
    "from pyodide_js import FS",
    `FS.writeFile('./pyscript.py', ${JSON.stringify(
        [
            "import polyscript",
            "document=polyscript.xworker.window.document",
            "window=polyscript.xworker.window",
            "sync=polyscript.xworker.sync",
            display_py,
        ].join("\n"),
    )})`,
].join("\n");

const workerHooks = {
    codeBeforeRunWorker: () =>
        [workerPyScriptModule, ...hooks.codeBeforeRunWorker].join("\n"),
    codeBeforeRunWorkerAsync: () =>
        [workerPyScriptModule, ...hooks.codeBeforeRunWorkerAsync].join("\n"),
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
        console.log("onInterpreterReady");
        writeStdlib(pyodide, element);
        console.log("after writeStdlib");
        registerModule(pyodide, element);
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

            if (!hasTarget) element.after(show);
            if (!show.id) show.id = getID();

            // allows the code to retrieve the target element via
            // document.currentScript.target if needed
            defineProperty(element, "target", { value: show });

            pyodide[`run${isAsync ? "Async" : ""}`](
                await fetchSource(element, pyodide.io),
            );
        } else {
            // resolve PyScriptElement to allow connectedCallback
            element._pyodide.resolve(pyodide);
        }
    },
});

class PyScriptElement extends HTMLElement {
    constructor() {
        if (!super().id) this.id = getID();
        this._pyodide = Promise.withResolvers();
        this.srcCode = "";
        this.executed = false;
    }
    async connectedCallback() {
        if (!this.executed) {
            this.executed = true;
            const { io, run } = await this._pyodide.promise;
            this.srcCode = await fetchSource(this, io);
            this.textContent = "";
            run(this.srcCode);
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
    return XWorker.call(new Hook(null, workerHooks), file, {
        ...options,
        type: "pyodide",
    });
}
