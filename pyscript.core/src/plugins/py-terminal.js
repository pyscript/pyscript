// PyScript py-terminal plugin
import { TYPES, hooks } from "../core.js";
import { notify } from "./error.js";
import { defineProperty } from "polyscript/exports";

const SELECTOR = [...TYPES.keys()]
    .map((type) => `script[type="${type}"][terminal],${type}-script[terminal]`)
    .join(",");

// show the error on main and
// stops the module from keep executing
const notifyAndThrow = (message) => {
    notify(message);
    throw new Error(message);
};

const notParsedYet = (script) => !bootstrapped.has(script);

const onceOnMain = ({ attributes: { worker } }) => !worker;

const bootstrapped = new WeakSet();

let addStyle = true;

// this callback will be serialized as string and it never needs
// to be invoked multiple times. Each xworker here is bootstrapped
// only once thanks to the `sync.is_pyterminal()` check.
const workerReady = ({ interpreter, io, run }, { sync }) => {
    if (!sync.is_pyterminal()) return;

    // in workers it's always safe to grab the polyscript currentScript
    run("from polyscript.currentScript import terminal as __terminal__");

    // This part is inevitably duplicated as external scope
    // can't be reached by workers out of the box.
    // The detail is that here we use sync though, not readline.
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

    io.stderr = (error) => {
        sync.pyterminal_write(`${error.message || error}\n`);
    };
};

const pyTerminal = async () => {
    const terminals = document.querySelectorAll(SELECTOR);

    const unknown = [].filter.call(terminals, notParsedYet);

    // no results will look further for runtime nodes
    if (!unknown.length) return;
    // early flag elements as known to avoid concurrent
    // MutationObserver invokes of this async handler
    else unknown.forEach(bootstrapped.add, bootstrapped);

    // we currently support only one terminal as in "classic"
    if ([].filter.call(terminals, onceOnMain).length > 1)
        notifyAndThrow("You can use at most 1 main terminal");

    // import styles lazily
    if (addStyle) {
        addStyle = false;
        document.head.append(
            Object.assign(document.createElement("link"), {
                rel: "stylesheet",
                href: new URL("./xterm.css", import.meta.url),
            }),
        );
    }

    // lazy load these only when a valid terminal is found
    const [{ Terminal }, { Readline }, { FitAddon }] = await Promise.all([
        import(/* webpackIgnore: true */ "../3rd-party/xterm.js"),
        import(/* webpackIgnore: true */ "../3rd-party/xterm-readline.js"),
        import(/* webpackIgnore: true */ "../3rd-party/xterm_addon-fit.js"),
    ]);

    for (const element of unknown) {
        // hopefully to be removed in the near future!
        if (element.matches('script[type="mpy"],mpy-script'))
            notifyAndThrow("Unsupported terminal.");

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
            defineProperty(element, "terminal", { value: terminal });
            return terminal;
        };

        // branch logic for the worker
        if (element.hasAttribute("worker")) {
            // add a hook on the main thread to setup all sync helpers
            // also bootstrapping the XTerm target on main *BUT* ...
            hooks.main.onWorker.add(function worker(_, xworker) {
                // ... as multiple workers will add multiple callbacks
                // be sure no xworker is ever initialized twice!
                if (bootstrapped.has(xworker)) return;
                bootstrapped.add(xworker);

                // still cleanup this callback for future scripts/workers
                hooks.main.onWorker.delete(worker);

                init({
                    disableStdin: false,
                    cursorBlink: true,
                    cursorStyle: "block",
                });

                xworker.sync.is_pyterminal = () => true;
                xworker.sync.pyterminal_read = readline.read.bind(readline);
                xworker.sync.pyterminal_write = readline.write.bind(readline);
            });

            // setup remote thread JS/Python code for whenever the
            // worker is ready to become a terminal
            hooks.worker.onReady.add(workerReady);
        } else {
            // in the main case, just bootstrap XTerm without
            // allowing any input as that's not possible / awkward
            hooks.main.onReady.add(function main({ interpreter, io, run }) {
                console.warn("py-terminal is read only on main thread");
                hooks.main.onReady.delete(main);

                // on main, it's easy to trash and clean the current terminal
                globalThis.__py_terminal__ = init({
                    disableStdin: true,
                    cursorBlink: false,
                    cursorStyle: "underline",
                });
                run("from js import __py_terminal__ as __terminal__");
                delete globalThis.__py_terminal__;

                // This part is inevitably duplicated as external scope
                // can't be reached by workers out of the box.
                // The detail is that here we use readline here, not sync.
                const decoder = new TextDecoder();
                let data = "";
                const generic = {
                    isatty: true,
                    write(buffer) {
                        data = decoder.decode(buffer);
                        readline.write(data);
                        return buffer.length;
                    },
                };
                interpreter.setStdout(generic);
                interpreter.setStderr(generic);
                interpreter.setStdin({
                    isatty: true,
                    stdin: () => readline.read(data),
                });

                io.stderr = (error) => {
                    readline.write(`${error.message || error}\n`);
                };
            });
        }
    }
};

const mo = new MutationObserver(pyTerminal);
mo.observe(document, { childList: true, subtree: true });

// try to check the current document ASAP
export default pyTerminal();
