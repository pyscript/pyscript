import { define } from "@pyscript/core";

// append ASAP CSS to avoid showing content
document.head.appendChild(document.createElement("style")).textContent = `
  py-script, py-config {
    display: none;
  }
`;

// create a unique identifier when/if needed
let id = 0;
const getID = (prefix = "py-script") => `${prefix}-${id++}`;

let bootstrap = true,
    XWorker,
    sharedRuntime;
const sharedPyodide = new Promise((resolve) => {
    const pyConfig = document.querySelector("py-config");
    const config = pyConfig?.getAttribute("src") || pyConfig?.textContent;
    define("py", {
        config,
        interpreter: "pyodide",
        codeBeforeRunWorker: `print('codeBeforeRunWorker')`,
        codeAfterRunWorker: `print('codeAfterRunWorker')`,
        onBeforeRun(pyodide, node) {
            pyodide.interpreter.globals.set("XWorker", XWorker);
            console.log("onBeforeRun", sharedRuntime === pyodide, node);
        },
        onAfterRun(pyodide, node) {
            console.log("onAfterRun", sharedRuntime === pyodide, node);
        },
        async onRuntimeReady(pyodide) {
            // bootstrap the shared runtime once
            // as each node as plugin gets onRuntimeReady called once
            // because no custom-element is strictly needed
            if (bootstrap) {
                bootstrap = false;
                sharedRuntime = pyodide;
                XWorker = pyodide.XWorker;
                pyodide.io.stdout = (message) => {
                    console.log("🐍", pyodide.type, message);
                };
                // do any module / JS injection in here such as
                // Element, display, and friends ... then:
                resolve(pyodide);
            }
        },
    });
});

/** @type {WeakSet<PyScriptElement>} */
const known = new WeakSet();

class PyScriptElement extends HTMLElement {
    constructor() {
        if (!super().id) this.id = getID();
    }
    async connectedCallback() {
        if (!known.has(this)) {
            known.add(this);
            // sharedPyodide contains various helpers including run and runAsync
            const { run } = await sharedPyodide;
            // do any stuff needed to finalize this element bootstrap
            // (i.e. check src attribute and so on)
            this.replaceChildren(run(this.textContent) || "");
            // reveal the node on the page
            this.style.display = "block";
        }
    }
}

customElements.define("py-script", PyScriptElement);
