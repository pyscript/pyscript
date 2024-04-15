// PyScript py-terminal plugin
import { TYPES, hooks } from "../core.js";
import { notify } from "./error.js";
import { customObserver, defineProperties } from "polyscript/exports";

// will contain all valid selectors
const SELECTORS = [];

// show the error on main and
// stops the module from keep executing
const notifyAndThrow = (message) => {
    notify(message);
    throw new Error(message);
};

const onceOnMain = ({ attributes: { worker } }) => !worker;

const bootstrapped = new WeakSet();

let addStyle = true;

// this callback will be serialized as string and it never needs
// to be invoked multiple times. Each xworker here is bootstrapped
// only once thanks to the `sync.is_pyterminal()` check.
const workerReady = ({ interpreter, io, run, type }, { sync }) => {
    if (!sync.is_pyterminal()) return;

    // in workers it's always safe to grab the polyscript currentScript
    // the ugly `_` dance is due MicroPython not able to import via:
    // `from polyscript.currentScript import terminal as __terminal__`
    run(
        "from polyscript import currentScript as _; __terminal__ = _.terminal; del _",
    );

    let data = "";
    const { pyterminal_read, pyterminal_write } = sync;
    const decoder = new TextDecoder();
    const generic = {
        isatty: false,
        write(buffer) {
            data = decoder.decode(buffer);
            pyterminal_write(data);
            return buffer.length;
        },
    };

    // This part works already in both Pyodide and MicroPython
    io.stderr = (error) => {
        pyterminal_write(String(error.message || error));
    };

    // MicroPython has no code or code.interact()
    // This part patches it in a way that simulates
    // the code.interact() module in Pyodide.
    if (type === "mpy") {
        // monkey patch global input otherwise broken in MicroPython
        interpreter.registerJsModule("_pyscript_input", {
            input: pyterminal_read,
        });
        run("from _pyscript_input import input");

        // this is needed to avoid truncated unicode in MicroPython
        // the reason is that `linebuffer` false just send one byte
        // per time and readline here doesn't like it much.
        // MicroPython also has issues with code-points and
        // replProcessChar(byte) but that function accepts only
        // one byte per time so ... we have an issue!
        // @see https://github.com/pyscript/pyscript/pull/2018
        // @see https://github.com/WebReflection/buffer-points
        const bufferPoints = (stdio) => {
            const bytes = [];
            let needed = 0;
            return (buffer) => {
                let written = 0;
                for (const byte of buffer) {
                    bytes.push(byte);
                    // @see https://encoding.spec.whatwg.org/#utf-8-bytes-needed
                    if (needed) needed--;
                    else if (0xc2 <= byte && byte <= 0xdf) needed = 1;
                    else if (0xe0 <= byte && byte <= 0xef) needed = 2;
                    else if (0xf0 <= byte && byte <= 0xf4) needed = 3;
                    if (!needed) {
                        written += bytes.length;
                        stdio(new Uint8Array(bytes.splice(0)));
                    }
                }
                return written;
            };
        };

        io.stdout = bufferPoints(generic.write);

        // tiny shim of the code module with only interact
        // to bootstrap a REPL like environment
        interpreter.registerJsModule("code", {
            interact() {
                let input = "";
                let length = 1;

                const encoder = new TextEncoder();
                const acc = [];
                const handlePoints = bufferPoints((buffer) => {
                    acc.push(...buffer);
                    pyterminal_write(decoder.decode(buffer));
                });

                // avoid duplicating the output produced by the input
                io.stdout = (buffer) =>
                    length++ > input.length ? handlePoints(buffer) : 0;

                interpreter.replInit();

                // loop forever waiting for user inputs
                (function repl() {
                    const out = decoder.decode(new Uint8Array(acc.splice(0)));
                    // print in current line only the last line produced by the REPL
                    const data = `${pyterminal_read(out.split("\n").at(-1))}\r`;
                    length = 0;
                    input = encoder.encode(data);
                    for (const c of input) interpreter.replProcessChar(c);
                    repl();
                })();
            },
        });
    } else {
        interpreter.setStdout(generic);
        interpreter.setStderr(generic);
        interpreter.setStdin({
            isatty: false,
            stdin: () => pyterminal_read(data),
        });
    }
};

const pyTerminal = async (element) => {
    // lazy load these only when a valid terminal is found
    const [{ Terminal }, { Readline }, { FitAddon }, { WebLinksAddon }] =
        await Promise.all([
            import(/* webpackIgnore: true */ "../3rd-party/xterm.js"),
            import(/* webpackIgnore: true */ "../3rd-party/xterm-readline.js"),
            import(/* webpackIgnore: true */ "../3rd-party/xterm_addon-fit.js"),
            import(
                /* webpackIgnore: true */ "../3rd-party/xterm_addon-web-links.js"
            ),
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
        terminal.loadAddon(new WebLinksAddon());
        terminal.open(target);
        fitAddon.fit();
        terminal.focus();
        defineProperties(element, {
            terminal: { value: terminal },
            process: {
                value: async (code) => {
                    // this loop is the only way I could find to actually simulate
                    // the user input char after char in a way that works in both
                    // MicroPython and Pyodide
                    for (const line of code.split(/(?:\r|\n|\r\n)/)) {
                        terminal.paste(`${line}\n`);
                        do {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 0),
                            );
                        } while (!readline.activeRead?.resolve);
                        readline.activeRead.resolve(line);
                    }
                },
            },
        });
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
        hooks.main.onReady.add(function main({ interpreter, io, run, type }) {
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

            io.stderr = (error) => {
                readline.write(String(error.message || error));
            };

            if (type === "mpy") {
                interpreter.setStdin = Object; // as no-op
                interpreter.setStderr = Object; // as no-op
                interpreter.setStdout = ({ write }) => {
                    io.stdout = write;
                };
            }

            let data = "";
            const decoder = new TextDecoder();
            const generic = {
                isatty: false,
                write(buffer) {
                    data = decoder.decode(buffer);
                    readline.write(data);
                    return buffer.length;
                },
            };
            interpreter.setStdout(generic);
            interpreter.setStderr(generic);
            interpreter.setStdin({
                isatty: false,
                stdin: () => readline.read(data),
            });
        });
    }
};

for (const key of TYPES.keys()) {
    const selector = `script[type="${key}"][terminal],${key}-script[terminal]`;
    SELECTORS.push(selector);
    customObserver.set(selector, async (element) => {
        // we currently support only one terminal on main as in "classic"
        const terminals = document.querySelectorAll(SELECTORS.join(","));
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

        await pyTerminal(element);
    });
}
