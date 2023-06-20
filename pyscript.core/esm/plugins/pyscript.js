import "@ungap/with-resolvers";
import { $ } from "basic-devtools";

import { define } from "../index.js";
import { queryTarget } from "../script-handler.js";
import { defineProperty } from "../utils.js";
import { getText } from "../fetch-utils.js";

// append ASAP CSS to avoid showing content
document.head.appendChild(document.createElement("style")).textContent = `
  py-script, py-config {
    display: none;
  }
`;

// create a unique identifier when/if needed
let id = 0;
const getID = (prefix = "py-script") => `${prefix}-${id++}`;

// find the shared config for all py-script elements
let config;
let pyConfig = $("py-config");
if (pyConfig) config = pyConfig.getAttribute("src") || pyConfig.textContent;
else {
    pyConfig = $('script[type="py"]');
    config = pyConfig?.getAttribute("config");
}

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

// define the module as both `<script type="py">` and `<py-script>`
define("py", {
    config,
    env: "py-script",
    interpreter: "pyodide",
    codeBeforeRunWorker: `print("codeBeforeRunWorker")`,
    codeAfterRunWorker: `print("codeAfterRunWorker")`,
    onBeforeRun(pyodide, element) {
        if (isScript(element)) before(element);
    },
    onBeforeRunAync(pyodide, element) {
        if (isScript(element)) before(element);
    },
    onAfterRun(pyodide, element) {
        if (isScript(element)) after();
    },
    onAfterRunAsync(pyodide, element) {
        if (isScript(element)) after();
    },
    async onRuntimeReady(pyodide, element) {
        if (isScript(element)) {
            const {
                attributes: { async: isAsync, target },
                src,
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

            const code = src
                ? await fetch(src).then(getText)
                : element.textContent;
            pyodide[`run${isAsync ? "Async" : ""}`](code);
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
    }
    async connectedCallback() {
        const { run } = await this._pyodide.promise;
        const result = run(this.textContent);
        if (result) this.replaceChildren(result);
        this.style.display = "block";
    }
}

customElements.define("py-script", PyScriptElement);
