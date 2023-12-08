// PyScript py-editor plugin
import { Hook, XWorker, dedent } from "polyscript/exports";
import { TYPES } from "../core.js";

const RUN_BUTTON = `<svg style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>`;

let id = 0;
const getID = (type) => `${type}-editor-${id++}`;

const envs = new Map();

const hooks = {
    worker: {
        // works on both Pyodide and MicroPython
        onReady: ({ runAsync, io }, { sync }) => {
            io.stdout = (line) => sync.write(line);
            io.stderr = (line) => sync.writeErr(line);
            sync.revoke();
            sync.runAsync = runAsync;
        },
    },
};

async function execute({ currentTarget }) {
    const { env, pySrc, outDiv } = this;

    currentTarget.disabled = true;
    outDiv.innerHTML = "";

    if (!envs.has(env)) {
        const srcLink = URL.createObjectURL(new Blob([""]));
        const xworker = XWorker.call(new Hook(null, hooks), srcLink, {
            type: this.interpreter,
        });

        const { sync } = xworker;
        const { promise, resolve } = Promise.withResolvers();
        envs.set(env, promise);
        sync.revoke = () => {
            URL.revokeObjectURL(srcLink);
            resolve(xworker);
        };
    }

    // wait for the env then set the target div
    // before executing the current code
    envs.get(env).then((xworker) => {
        xworker.onerror = ({ error }) => {
            outDiv.innerHTML += `<span style='color:red'>${
                error.message || error
            }</span>\n`;
            console.error(error);
        };

        const enable = () => {
            currentTarget.disabled = false;
        };
        const { sync } = xworker;
        sync.write = (str) => {
            outDiv.innerText += `${str}\n`;
        };
        sync.writeErr = (str) => {
            outDiv.innerHTML += `<span style='color:red'>${str}</span>\n`;
        };
        sync.runAsync(pySrc).then(enable, enable);
    });
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

    editorDiv.append(runButton, editorShadowContainer);

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
        import(/* webpackIgnore: true */ "../3rd-party/codemirror.js"),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_state.js"),
        import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_lang-python.js"
        ),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_language.js"),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_view.js"),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_commands.js"),
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

    const env = `${interpreter}-${script.getAttribute("env") || getID(type)}`;
    const context = {
        interpreter,
        env,
        get pySrc() {
            return editor.state.doc.toString();
        },
        get outDiv() {
            return outDiv;
        },
    };

    // @see https://github.com/JeffersGlass/mkdocs-pyscript/blob/main/mkdocs_pyscript/js/makeblocks.js
    const listener = execute.bind(context);
    const [boxDiv, outDiv] = makeBoxDiv(listener, type);
    boxDiv.dataset.env = script.hasAttribute("env") ? env : interpreter;

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
let timeout = 0;

// reset interval value then check for new scripts
const resetTimeout = () => {
    timeout = 0;
    pyEditor();
};

// triggered both ASAP on the living DOM and via MutationObserver later
const pyEditor = async () => {
    if (timeout) return;
    timeout = setTimeout(resetTimeout, 250);
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
