// PyScript py-editor plugin
import { Hook, XWorker, dedent, defineProperties } from "polyscript/exports";
import { TYPES, offline_interpreter, relative_url, stdlib } from "../core.js";
import { notify } from "./error.js";

const RUN_BUTTON = `<svg style="height:20px;width:20px;vertical-align:-.125em;transform-origin:center;overflow:visible;color:green" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>`;

let id = 0;
const getID = (type) => `${type}-editor-${id++}`;

const envs = new Map();
const configs = new Map();

const hooks = {
    worker: {
        codeBeforeRun: () => stdlib,
        // works on both Pyodide and MicroPython
        onReady: ({ runAsync, io }, { sync }) => {
            io.stdout = io.buffered(sync.write);
            io.stderr = io.buffered(sync.writeErr);
            sync.revoke();
            sync.runAsync = runAsync;
        },
    },
};

const validate = (config, result) => {
    if (typeof result === "boolean") throw `Invalid source: ${config}`;
    return result;
};

async function execute({ currentTarget }) {
    const { env, pySrc, outDiv } = this;
    const hasRunButton = !!currentTarget;

    if (hasRunButton) {
        currentTarget.disabled = true;
        outDiv.innerHTML = "";
    }

    if (!envs.has(env)) {
        const srcLink = URL.createObjectURL(new Blob([""]));
        const details = {
            type: this.interpreter,
            serviceWorker: this.serviceWorker,
        };
        const { config } = this;
        if (config) {
            // verify that config can be parsed and used
            try {
                details.configURL = relative_url(config);
                if (config.endsWith(".toml")) {
                    const [{ parse }, toml] = await Promise.all([
                        import(
                            /* webpackIgnore: true */ "../3rd-party/toml.js"
                        ),
                        fetch(config).then((r) => r.ok && r.text()),
                    ]);
                    details.config = parse(validate(config, toml));
                } else if (config.endsWith(".json")) {
                    const json = await fetch(config).then(
                        (r) => r.ok && r.json(),
                    );
                    details.config = validate(config, json);
                } else {
                    details.configURL = relative_url("./config.txt");
                    details.config = JSON.parse(config);
                }
                details.version = offline_interpreter(details.config);
            } catch (error) {
                notify(error);
                return;
            }
        } else {
            details.config = {};
        }

        const xworker = XWorker.call(new Hook(null, hooks), srcLink, details);

        // expose xworker like in terminal or other workers to allow
        // creation and destruction of editors on the fly
        if (hasRunButton) {
            for (const type of TYPES.keys()) {
                const editor = currentTarget.closest(`.${type}-editor-box`);
                const script = editor?.parentNode?.previousElementSibling;
                if (script) {
                    defineProperties(script, { xworker: { value: xworker } });
                    break;
                }
            }
        }

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
    return envs.get(env).then((xworker) => {
        xworker.onerror = ({ error }) => {
            if (hasRunButton) {
                outDiv.insertAdjacentHTML(
                    "beforeend",
                    `<span style='color:red'>${
                        error.message || error
                    }</span>\n`,
                );
            }
            console.error(error);
        };

        const enable = () => {
            if (hasRunButton) currentTarget.disabled = false;
        };
        const { sync } = xworker;
        sync.write = (str) => {
            if (hasRunButton) outDiv.innerText += `${str}\n`;
            else console.log(str);
        };
        sync.writeErr = (str) => {
            if (hasRunButton) {
                outDiv.insertAdjacentHTML(
                    "beforeend",
                    `<span style='color:red'>${str}</span>\n`,
                );
            } else {
                notify(str);
                console.error(str);
            }
        };
        sync.runAsync(pySrc).then(enable, enable);
    });
}

const makeRunButton = (handler, type) => {
    const runButton = document.createElement("button");
    runButton.className = `absolute ${type}-editor-run-button`;
    runButton.innerHTML = RUN_BUTTON;
    runButton.setAttribute("aria-label", "Python Script Run Button");
    runButton.addEventListener("click", async (event) => {
        runButton.blur();
        await handler.handleEvent(event);
    });
    return runButton;
};

const makeEditorDiv = (handler, type) => {
    const editorDiv = document.createElement("div");
    editorDiv.className = `${type}-editor-input`;
    editorDiv.setAttribute("aria-label", "Python Script Area");

    const runButton = makeRunButton(handler, type);
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

const makeBoxDiv = (handler, type) => {
    const boxDiv = document.createElement("div");
    boxDiv.className = `${type}-editor-box`;

    const editorDiv = makeEditorDiv(handler, type);
    const outDiv = makeOutDiv(type);
    boxDiv.append(editorDiv, outDiv);

    return [boxDiv, outDiv, editorDiv.querySelector("button")];
};

const init = async (script, type, interpreter) => {
    const [
        { basicSetup, EditorView },
        { Compartment },
        { python },
        { indentUnit },
        { keymap },
        { defaultKeymap, indentWithTab },
    ] = await Promise.all([
        import(/* webpackIgnore: true */ "../3rd-party/codemirror.js"),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_state.js"),
        import(
            /* webpackIgnore: true */ "../3rd-party/codemirror_lang-python.js"
        ),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_language.js"),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_view.js"),
        import(/* webpackIgnore: true */ "../3rd-party/codemirror_commands.js"),
    ]);

    let isSetup = script.hasAttribute("setup");
    const hasConfig = script.hasAttribute("config");
    const serviceWorker = script.getAttribute("service-worker");
    const env = `${interpreter}-${script.getAttribute("env") || getID(type)}`;

    // helps preventing too lazy ServiceWorker initialization on button run
    if (serviceWorker) {
        new XWorker("data:application/javascript,postMessage(0)", {
            type: "dummy",
            serviceWorker,
        }).onmessage = ({ target }) => target.terminate();
    }

    if (hasConfig && configs.has(env)) {
        throw new SyntaxError(
            configs.get(env)
                ? `duplicated config for env: ${env}`
                : `unable to add a config to the env: ${env}`,
        );
    }

    configs.set(env, hasConfig);

    let source = script.textContent;

    // verify the src points to a valid file that can be parsed
    const { src } = script;
    if (src) {
        try {
            source = validate(
                src,
                await fetch(src).then((b) => b.ok && b.text()),
            );
        } catch (error) {
            notify(error);
            return;
        }
    }

    const context = {
        // allow the listener to be overridden at distance
        handleEvent: execute,
        serviceWorker,
        interpreter,
        env,
        config: hasConfig && script.getAttribute("config"),
        get pySrc() {
            return isSetup ? source : editor.state.doc.toString();
        },
        get outDiv() {
            return isSetup ? null : outDiv;
        },
    };

    let target;
    defineProperties(script, {
        target: { get: () => target },
        handleEvent: {
            get: () => context.handleEvent,
            set: (callback) => {
                // do not bother with logic if it was set back as its original handler
                if (callback === execute) context.handleEvent = execute;
                // in every other case be sure that if the listener override returned
                // `false` nothing happens, otherwise keep doing what it always did
                else {
                    context.handleEvent = async (event) => {
                        // trap the currentTarget ASAP (if any)
                        // otherwise it gets lost asynchronously
                        const { currentTarget } = event;
                        // augment a code snapshot before invoking the override
                        defineProperties(event, {
                            code: { value: context.pySrc },
                        });
                        // avoid executing the default handler if the override returned `false`
                        if ((await callback(event)) !== false)
                            await execute.call(context, { currentTarget });
                    };
                }
            },
        },
        code: {
            get: () => context.pySrc,
            set: (insert) => {
                if (isSetup) return;
                editor.update([
                    editor.state.update({
                        changes: {
                            from: 0,
                            to: editor.state.doc.length,
                            insert,
                        },
                    }),
                ]);
            },
        },
        process: {
            /**
             * Simulate a setup node overriding the source to evaluate.
             * @param {string} code the Python code to evaluate.
             * @param {boolean} asRunButtonAction invoke the `Run` button handler.
             * @returns {Promise<...>} fulfill once code has been evaluated.
             */
            value(code, asRunButtonAction = false) {
                if (asRunButtonAction) return listener();
                const wasSetup = isSetup;
                const wasSource = source;
                isSetup = true;
                source = code;
                const restore = () => {
                    isSetup = wasSetup;
                    source = wasSource;
                };
                return context
                    .handleEvent({ currentTarget: null })
                    .then(restore, restore);
            },
        },
    });

    const notifyEditor = () => {
        const event = new Event(`${type}-editor`, { bubbles: true });
        script.dispatchEvent(event);
    };

    if (isSetup) {
        await context.handleEvent({ currentTarget: null });
        notifyEditor();
        return;
    }

    const selector = script.getAttribute("target");

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
    const [boxDiv, outDiv, runButton] = makeBoxDiv(context, type);
    boxDiv.dataset.env = script.hasAttribute("env") ? env : interpreter;

    const inputChild = boxDiv.querySelector(`.${type}-editor-input > div`);
    const parent = inputChild.attachShadow({ mode: "open" });
    // avoid inheriting styles from the outer component
    parent.innerHTML = `<style> :host { all: initial; }</style>`;

    target.appendChild(boxDiv);

    const doc = dedent(script.textContent).trim();

    // preserve user indentation, if any
    const indentation = /^([ \t]+)/m.test(doc) ? RegExp.$1 : "    ";

    const listener = () => runButton.click();
    const editor = new EditorView({
        extensions: [
            indentUnit.of(indentation),
            new Compartment().of(python()),
            keymap.of([
                ...defaultKeymap,
                { key: "Ctrl-Enter", run: listener, preventDefault: true },
                { key: "Cmd-Enter", run: listener, preventDefault: true },
                { key: "Shift-Enter", run: listener, preventDefault: true },
                // @see https://codemirror.net/examples/tab/
                indentWithTab,
            ]),
            basicSetup,
        ],
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        parent,
        doc,
    });

    editor.focus();
    notifyEditor();
};

// avoid too greedy MutationObserver operations at distance
let timeout = 0;

// avoid delayed initialization
let queue = Promise.resolve();

// reset interval value then check for new scripts
const resetTimeout = () => {
    timeout = 0;
    pyEditor();
};

// triggered both ASAP on the living DOM and via MutationObserver later
const pyEditor = () => {
    if (timeout) return;
    timeout = setTimeout(resetTimeout, 250);
    for (const [type, interpreter] of TYPES) {
        const selector = `script[type="${type}-editor"]`;
        for (const script of document.querySelectorAll(selector)) {
            // avoid any further bootstrap by changing the type as active
            script.type += "-active";
            // don't await in here or multiple calls might happen
            // while the first script is being initialized
            queue = queue.then(() => init(script, type, interpreter));
        }
    }
    return queue;
};

new MutationObserver(pyEditor).observe(document, {
    childList: true,
    subtree: true,
});

// try to check the current document ASAP
export default pyEditor();
