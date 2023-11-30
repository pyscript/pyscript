// PyScript py-terminal plugin
import { TYPES, hooks } from "../core.js";
import { notify } from "./error.js";

const SELECTOR = [...TYPES.keys()]
    .map((type) => `script[type="${type}"][terminal],${type}-script[terminal]`)
    .join(",");

// show the error on main and
// stops the module from keep executing
const notifyAndThrow = (message) => {
    notify(message);
    throw new Error(message);
};

const pyTerminal = async () => {
    const terminals = document.querySelectorAll(SELECTOR);

    // no results will look further for runtime nodes
    if (!terminals.length) return;

    // if we arrived this far, let's drop the MutationObserver
    // as we only support one terminal per page (right now).
    mo.disconnect();

    // we currently support only one terminal as in "classic"
    if (terminals.length > 1) notifyAndThrow("You can use at most 1 terminal.");

    const [element] = terminals;
    // hopefully to be removed in the near future!
    if (element.matches('script[type="mpy"],mpy-script'))
        notifyAndThrow("Unsupported terminal.");

    // import styles lazily
    document.head.append(
        Object.assign(document.createElement("link"), {
            rel: "stylesheet",
            href: new URL("./xterm.css", import.meta.url),
        }),
    );

    // lazy load these only when a valid terminal is found
    const [{ Terminal }, { Readline }, { FitAddon }] = await Promise.all([
        import(/* webpackIgnore: true */ "../3rd-party/xterm.js"),
        import(/* webpackIgnore: true */ "../3rd-party/xterm-readline.js"),
        import(/* webpackIgnore: true */ "../3rd-party/xterm_addon-fit.js"),
    ]);

    const readline = new Readline();

    // common main thread initialization for both worker
    // or main case, bootstrapping the terminal on its target
    const init = (options) => {
        let target = element;
        const selector = element.getAttribute("target");
        if (selector) {
            target =
                document.getElementById(selector) ||
                document.querySelector(selector);
            if (!target) throw new Error(`Unknown target ${selector}`);
        } else {
            target = document.createElement("py-terminal");
            target.style.display = "block";
            element.after(target);
        }
        const terminal = new Terminal({
            theme: {
                background: "#191A19",
                foreground: "#F5F2E7",
            },
            ...options,
        });
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(readline);
        terminal.open(target);
        fitAddon.fit();
        terminal.focus();
    };

    // branch logic for the worker
    if (element.hasAttribute("worker")) {
        // when the remote thread onReady triggers:
        // setup the interpreter stdout and stderr
        const workerReady = ({ interpreter }, { sync }) => {
            sync.pyterminal_drop_hooks();
            const decoder = new TextDecoder();
            let data = "";
            const generic = {
                isatty: true,
                write(buffer) {
                    data = decoder.decode(buffer);
                    sync.pyterminal_write(data);
                    return buffer.length;
                },
            };
            interpreter.setStdout(generic);
            interpreter.setStderr(generic);
            interpreter.setStdin({
                isatty: true,
                stdin: () => sync.pyterminal_read(data),
            });
        };

        // add a hook on the main thread to setup all sync helpers
        // also bootstrapping the XTerm target on main
        hooks.main.onWorker.add(function worker(_, xworker) {
            hooks.main.onWorker.delete(worker);
            init({
                disableStdin: false,
                cursorBlink: true,
                cursorStyle: "block",
            });
            xworker.sync.pyterminal_read = readline.read.bind(readline);
            xworker.sync.pyterminal_write = readline.write.bind(readline);
            // allow a worker to drop main thread hooks ASAP
            xworker.sync.pyterminal_drop_hooks = () => {
                hooks.worker.onReady.delete(workerReady);
            };
        });

        // setup remote thread JS/Python code for whenever the
        // worker is ready to become a terminal
        hooks.worker.onReady.add(workerReady);
    } else {
        // in the main case, just bootstrap XTerm without
        // allowing any input as that's not possible / awkward
        hooks.main.onReady.add(function main({ io }) {
            console.warn("py-terminal is read only on main thread");
            hooks.main.onReady.delete(main);
            init({
                disableStdin: true,
                cursorBlink: false,
                cursorStyle: "underline",
            });
            io.stdout = (value) => {
                readline.write(`${value}\n`);
            };
            io.stderr = (error) => {
                readline.write(`${error.message || error}\n`);
            };
        });
    }
};

const mo = new MutationObserver(pyTerminal);
mo.observe(document, { childList: true, subtree: true });

// try to check the current document ASAP
export default pyTerminal();
