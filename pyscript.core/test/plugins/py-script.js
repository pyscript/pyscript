import { registerPlugin } from "@pyscript/core";
import { interactivesrc } from "interactive"

// append ASAP CSS to avoid showing content
document.head.appendChild(document.createElement("style")).textContent = `
  py-script, py-config {
    display: none;
  }
`;

document.head.appendChild(document.createElement("link"))


// create a unique identifier when/if needed
let id = 0;
const getPyscriptId = (prefix = "py-script") => `${prefix}-${id++}`;

let bootstrap = true;
const sharedPyodide = new Promise((resolve) => {
    const pyConfig = document.querySelector("py-config");
    const config = pyConfig?.getAttribute("src") || pyConfig?.textContent;
    registerPlugin("py-script", {
        config,
        type: "pyodide", // or just 'py'
        async onRuntimeReady(_, pyodide) {
            // bootstrap the shared runtime once
            // as each node as plugin gets onRuntimeReady called once
            // because no custom-element is strictly needed
            if (bootstrap) {
                bootstrap = false;
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
        if (!super().id) this.id = getPyscriptId();
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

// Everything REPL related ////

const _xterm_cdn_base_url = 'https://cdn.jsdelivr.net/npm/xterm@5.1.0';

const cssTag = document.createElement('link');
cssTag.type = 'text/css';
cssTag.rel = 'stylesheet';
cssTag.href = _xterm_cdn_base_url + '/css/xterm.css';
document.head.appendChild(cssTag);
class PyReplElement extends HTMLElement{

    async connectedCallback() {
        if (!known.has(this)) {
            known.add(this);
            // sharedPyodide contains various helpers including run and runAsync
            const { run, runtime } = await sharedPyodide;

            this.term = new Terminal({ //xterm.js terminal
                allowProposedApi: true,
                cusorBlink: true,
                convertEol: true
            })

            this.term.open(this)

            runtime.setStdout({batched: (message) => {
                this.term.write(message + "\n")
            }})

            const pyInterpClass = run(interactivesrc) //Reference to xtermInteractive class
            const pyInterp = pyInterpClass(this.term)
            this.term.onKey(pyInterp.onKey)
            pyInterp.beginInteraction()
        }
    }
}

customElements.define("py-repl", PyReplElement);
