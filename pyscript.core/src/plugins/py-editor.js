// PyScript py-editor plugin
import { Hook, XWorker, dedent } from "polyscript/exports";
import { TYPES } from "../core.js";

const RUN_BUTTON = `<svg style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>`;

let id = 0;
const getID = (type) => `${type}-editor-${id++}`;

const hooks = {
    worker: {
        // works on both Pyodide and MicroPython
        onReady: ({ run, io }, { sync }) => {
            io.stdout = (line) => sync.write(line);
            io.stderr = (line) => sync.writeErr(line);
            sync.revoke();
            sync.eval = (data) => {
                run(data);
            };
        },
    },
};

async function execute() {
    const { interpreter, xworker, pySrc, outDiv } = this;

    outDiv.innerHTML = "";

    if (xworker) {
        xworker.sync.eval(pySrc);
    } else {
        const srcLink = URL.createObjectURL(new Blob([pySrc]));
        this.xworker = XWorker.call(new Hook(null, hooks), srcLink, {
            type: interpreter,
        });
        this.xworker.onerror = ({ error }) => {
            outDiv.innerHTML += `<span style='color:red'>${
                error.message || error
            }</span>`;
            console.log(error);
        };

        const { sync } = this.xworker;
        sync.revoke = () => {
            URL.revokeObjectURL(srcLink);
        };
        sync.write = (str) => {
            outDiv.innerText += str;
        };
        sync.writeErr = (str) => {
            outDiv.innerHTML += `<span style='color:red'>${str}</span>`;
        };
    }
}

const makeRunButton = (listener, type) => {
    const runButton = document.createElement("button");
    runButton.className = `absolute ${type}-editor-run-button`;
    runButton.innerHTML = RUN_BUTTON;
    runButton.setAttribute("aria-label", "Python Script Run Button");
    runButton.addEventListener("click", listener);
    return runButton;
};

const makeEditorDiv = (listener, type) => {
    const editorDiv = document.createElement("div");
    editorDiv.className = `${type}-editor-input`;
    editorDiv.setAttribute("aria-label", "Python Script Area");

    const runButton = makeRunButton(listener, type);
    const editorShadowContainer = document.createElement("div");

    // avoid outer elements intercepting key events (reveal as example)
    editorShadowContainer.addEventListener("keydown", (event) => {
        event.stopPropagation();
    });

    editorDiv.append(editorShadowContainer, runButton);

    return editorDiv;
};

const makeOutDiv = (type) => {
    const outDiv = document.createElement("div");
    outDiv.className = `${type}-editor-output`;
    outDiv.id = `${getID(type)}-output`;
    return outDiv;
};

const makeBoxDiv = (listener, type) => {
    const boxDiv = document.createElement("div");
    boxDiv.className = `${type}-editor-box`;

    const editorDiv = makeEditorDiv(listener, type);
    const outDiv = makeOutDiv(type);
    boxDiv.append(editorDiv, outDiv);

    return [boxDiv, outDiv];
};

const init = async (script, type, interpreter) => {
    const [
        { basicSetup, EditorView },
        { Compartment },
        { python },
        { indentUnit },
        { keymap },
        { defaultKeymap },
    ] = await Promise.all([
        // TODO: find a way to actually produce these bundles locally
        import("https://cdn.jsdelivr.net/npm/codemirror@6.0.1/+esm"),
        import("https://cdn.jsdelivr.net/npm/@codemirror/state@6.3.1/+esm"),
        import(
            "https://cdn.jsdelivr.net/npm/@codemirror/lang-python@6.1.3/+esm"
        ),
        import("https://cdn.jsdelivr.net/npm/@codemirror/language@6.9.2/+esm"),
        import("https://cdn.jsdelivr.net/npm/@codemirror/view@6.22.0/+esm"),
        import("https://cdn.jsdelivr.net/npm/@codemirror/commands@6.3.0/+esm"),
    ]);

    const selector = script.getAttribute("target");

    let target;
    if (selector) {
        target =
            document.getElementById(selector) ||
            document.querySelector(selector);
        if (!target) throw new Error(`Unknown target ${selector}`);
    } else {
        target = document.createElement(`${type}-editor`);
        target.style.display = "block";
        script.after(target);
    }

    if (!target.id) target.id = getID(type);
    if (!target.hasAttribute("exec-id")) target.setAttribute("exec-id", 0);
    if (!target.hasAttribute("root")) target.setAttribute("root", target.id);

    // @see https://github.com/JeffersGlass/mkdocs-pyscript/blob/main/mkdocs_pyscript/js/makeblocks.js
    const context = {
        interpreter,
        xworker: null,
        get pySrc() {
            return editor.state.doc.toString();
        },
        get outDiv() {
            return outDiv;
        },
    };

    const listener = execute.bind(context);
    const [boxDiv, outDiv] = makeBoxDiv(listener, type);

    const inputChild = boxDiv.querySelector(`.${type}-editor-input > div`);
    const parent = inputChild.attachShadow({ mode: "open" });
    // avoid inheriting styles from the outer component
    parent.innerHTML = `<style> :host { all: initial; }</style>`;

    target.appendChild(boxDiv);

    const doc = dedent(script.textContent).trim();

    // preserve user indentation, if any
    const indentation = /^(\s+)/m.test(doc) ? RegExp.$1 : "    ";

    const editor = new EditorView({
        extensions: [
            indentUnit.of(indentation),
            new Compartment().of(python()),
            keymap.of([
                ...defaultKeymap,
                { key: "Ctrl-Enter", run: listener, preventDefault: true },
                { key: "Cmd-Enter", run: listener, preventDefault: true },
                { key: "Shift-Enter", run: listener, preventDefault: true },
            ]),
            basicSetup,
        ],
        parent,
        doc,
    });

    editor.focus();
};

// avoid too greedy MutationObserver operations at distance
let interval = 0;

// reset interval value then check for new scripts
const resetInterval = () => {
    interval = 0;
    pyEditor();
};

// triggered both ASAP on the living DOM and via MutationObserver later
const pyEditor = async () => {
    if (interval) return;
    interval = setInterval(resetInterval, 250);
    for (const [type, interpreter] of TYPES) {
        const selector = `script[type="${type}-editor"]`;
        for (const script of document.querySelectorAll(selector)) {
            // avoid any further bootstrap
            script.type += "-active";
            await init(script, type, interpreter);
        }
    }
};

new MutationObserver(pyEditor).observe(document, {
    childList: true,
    subtree: true,
});

// try to check the current document ASAP
export default pyEditor();
