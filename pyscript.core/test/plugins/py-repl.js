import { registerPlugin } from "@pyscript/core";

const _xterm_cdn_base_url = 'https://cdn.jsdelivr.net/npm/xterm@5.1.0';
// append ASAP CSS to avoid showing content
document.head.appendChild(document.createElement("style")).textContent = `
  py-repl, py-config {
    display: none;
  }
`;

const cssTag = document.createElement('link');
cssTag.type = 'text/css';
cssTag.rel = 'stylesheet';
cssTag.href = _xterm_cdn_base_url + '/css/xterm.css';
document.head.appendChild(cssTag);

// create a unique identifier when/if needed
let id = 0;
const getID = (prefix = "py-repl") => `${prefix}-${id++}`;

let bootstrap = true;
const sharedPyodide = new Promise((resolve) => {
    const pyConfig = document.querySelector("py-config");
    const config = pyConfig?.getAttribute("src") || pyConfig?.textContent;
    registerPlugin("py-repl", {
        config,
        type: "pyodide", // or just 'py'
        async onRuntimeReady(_, pyodide) {
            // bootstrap the shared runtime once
            // as each node as plugin gets onRuntimeReady called once
            // because no custom-element is strictly needed

            if (bootstrap) {
                bootstrap = false;

                await import(_xterm_cdn_base_url + '/lib/xterm.js');
                
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

/** @type {WeakSet<PyReplElement>} */
const known = new WeakSet();

class PyReplElement extends HTMLElement {
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

            const term = new Terminal()
            term.open(this)
            const pyodide = await sharedPyodide
            pyodide.io.stdout = (message) => {
                this.term.write(message);
            };
        }
    }
}

customElements.define("py-repl", PyReplElement);
