import "@ungap/with-resolvers";
import { $ } from "basic-devtools";

import { define } from "../index.js";
import { queryTarget } from "../script-handler.js";
import { defineProperty } from "../utils.js";
import { getText } from "../fetch-utils.js";

// TODO: should this utility be in core instead?
import { robustFetch as fetch } from "./pyscript/fetch.js";

// append ASAP CSS to avoid showing content
document.head.appendChild(document.createElement("style")).textContent = `
  py-script, py-config {
    display: none;
  }
`;

(async () => {
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
    const fetchSource = async (tag) => {
        if (tag.hasAttribute("src")) {
            try {
                const response = await fetch(tag.getAttribute("src"));
                return response.then(getText);
            } catch (error) {
                // TODO _createAlertBanner(err) instead ?
                alert(error.message);
                throw error;
            }
        }
        return tag.textContent;
    };

    // common life-cycle handlers for any node
    const bootstrapNodeAndPlugins = (pyodide, element, callback, hook) => {
        if (isScript(element)) callback(element);
        for (const fn of hooks[hook]) fn(pyodide, element);
    };

    const addDisplay = (element) => {
        const id = isScript(element) ? element.target.id : element.id;
        return `
            # this code is just for demo purpose but the basics work
            def _display(what, target="${id}", append=True):
                from js import document
                element = document.getElementById(target)
                element.textContent = what
            display = _display
        `;
    };

    // define the module as both `<script type="py">` and `<py-script>`
    define("py", {
        config,
        env: "py-script",
        interpreter: "pyodide",
        codeBeforeRunWorker() {
            return [...hooks.codeBeforeRunWorker].join("\n");
        },
        codeAfterRunWorker() {
            return [...hooks.codeAfterRunWorker].join("\n");
        },
        onBeforeRun(pyodide, element) {
            bootstrapNodeAndPlugins(pyodide, element, before, "onBeforeRun");
            pyodide.interpreter.runPython(addDisplay(element));
        },
        onBeforeRunAync(pyodide, element) {
            pyodide.interpreter.runPython(addDisplay(element));
            bootstrapNodeAndPlugins(
                pyodide,
                element,
                before,
                "onBeforeRunAync",
            );
        },
        onAfterRun(pyodide, element) {
            bootstrapNodeAndPlugins(pyodide, element, after, "onAfterRun");
        },
        onAfterRunAsync(pyodide, element) {
            bootstrapNodeAndPlugins(pyodide, element, after, "onAfterRunAsync");
        },
        async onInterpreterReady(pyodide, element) {
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
                    await fetchSource(element),
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
                const { run } = await this._pyodide.promise;
                this.srcCode = await fetchSource(this);
                this.textContent = "";
                const result = run(this.srcCode);
                if (!this.textContent && result) this.textContent = result;
                this.style.display = "block";
            }
        }
    }

    customElements.define("py-script", PyScriptElement);
})();

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
