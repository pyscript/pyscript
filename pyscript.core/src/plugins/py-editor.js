// PyScript py-editor plugin
import { Hook, XWorker, dedent } from "polyscript/exports";

const RUN_BUTTON = `<svg style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>`;
const SELECTOR = `script[type="py-editor"]`;

let id = 0;
const getID = () => `py-editor-${id++}`;

const hooks = {
    worker: {
        // TODO or TBD: do we want our stdlib in here too?
        codeBeforeRun: () => `
            from polyscript import xworker
            import sys

            class MyStdout:
                def write(self, line):
                    xworker.sync.write(line)

            class MyStderr:
                def write(self, line):
                    xworker.sync.writeErr(line)

            sys.stdout = MyStdout()
            sys.stderr = MyStderr()
        `,
    },
};

async function execute() {
    const { pySrc, outDiv } = this;

    const srcLink = URL.createObjectURL(new Blob([pySrc]));
    outDiv.innerHTML = "";

    // TODO or TBD: are we sure we want a new pyodide per every single Run ???
    const xworker = XWorker.call(new Hook(null, hooks), srcLink, {
        type: "pyodide",
    });
    xworker.sync.write = (str) => {
        outDiv.innerText += str;
    };
    xworker.sync.writeErr = (str) => {
        outDiv.innerHTML += `<span style='color:red'>${str}</span>`;
    };
    xworker.onerror = ({ error }) => {
        outDiv.innerHTML += `<span style='color:red'>${
            error.message || error
        }</span>`;
        console.log(error);
    };
}

const makeRunButton = (listener) => {
    const runButton = document.createElement("button");
    runButton.className = "absolute py-editor-run-button";
    runButton.innerHTML = RUN_BUTTON;
    runButton.setAttribute("aria-label", "Python Script Run Button");
    runButton.addEventListener("click", listener);
    return runButton;
};

const makeEditorDiv = (listener) => {
    const editorDiv = document.createElement("div");
    editorDiv.className = "py-editor-input";
    editorDiv.setAttribute("aria-label", "Python Script Area");

    const runButton = makeRunButton(listener);
    const editorShadowContainer = document.createElement("div");

    // avoid outer elements intercepting key events (reveal as example)
    editorShadowContainer.addEventListener("keydown", (event) => {
        event.stopPropagation();
    });

    editorDiv.append(editorShadowContainer, runButton);

    return editorDiv;
};

const makeOutDiv = () => {
    const outDiv = document.createElement("div");
    outDiv.className = "py-editor-output";
    outDiv.id = getID() + "-output";
    return outDiv;
};

const makeBoxDiv = (listener) => {
    const boxDiv = document.createElement("div");
    boxDiv.className = "py-editor-box";

    const editorDiv = makeEditorDiv(listener);
    const outDiv = makeOutDiv();
    boxDiv.append(editorDiv, outDiv);

    return [boxDiv, outDiv];
};

const init = async (script) => {
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
        target = document.createElement("py-editor");
        target.style.display = "block";
        script.after(target);
    }

    if (!target.id) target.id = getID();
    if (!target.hasAttribute("exec-id")) target.setAttribute("exec-id", 0);
    if (!target.hasAttribute("root")) target.setAttribute("root", target.id);

    // @see https://github.com/JeffersGlass/mkdocs-pyscript/blob/main/mkdocs_pyscript/js/makeblocks.js
    const context = {
        get pySrc() {
            return editor.state.doc.toString();
        },
        get outDiv() {
            return outDiv;
        },
    };

    const listener = execute.bind(context);
    const [boxDiv, outDiv] = makeBoxDiv(listener);

    const inputChild = boxDiv.querySelector(".py-editor-input > div");
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
    for (const script of document.querySelectorAll(SELECTOR)) {
        // avoid any further bootstrap
        script.type += "-active";
        await init(script);
    }
};

new MutationObserver(pyEditor).observe(document, {
    childList: true,
    subtree: true,
});

// try to check the current document ASAP
export default pyEditor();
