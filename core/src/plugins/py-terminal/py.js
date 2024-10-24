// PyScript py-terminal plugin
import { defineProperties } from "polyscript/exports";
import { hooks } from "../../core.js";

const bootstrapped = new WeakSet();

// this callback will be serialized as string and it never needs
// to be invoked multiple times. Each xworker here is bootstrapped
// only once thanks to the `sync.is_pyterminal()` check.
const workerReady = ({ interpreter, io, run, type }, { sync }) => {
    if (type !== "py" || !sync.is_pyterminal()) return;

    run(
        [
            "from polyscript import currentScript as _",
            "__terminal__ = _.terminal",
            "del _",
        ].join(";"),
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

    io.stderr = (error) => {
        pyterminal_write(String(error.message || error));
    };

    interpreter.setStdout(generic);
    interpreter.setStderr(generic);
    interpreter.setStdin({
        isatty: false,
        stdin: () => pyterminal_read(data),
    });
};

export default async (element) => {
    // lazy load these only when a valid terminal is found
    const [{ Terminal }, { Readline }, { FitAddon }, { WebLinksAddon }] =
        await Promise.all([
            import(/* webpackIgnore: true */ "../../3rd-party/xterm.js"),
            import(
                /* webpackIgnore: true */ "../../3rd-party/xterm-readline.js"
            ),
            import(
                /* webpackIgnore: true */ "../../3rd-party/xterm_addon-fit.js"
            ),
            import(
                /* webpackIgnore: true */ "../../3rd-party/xterm_addon-web-links.js"
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
                    for (const line of code.split(/(?:\r\n|\r|\n)/)) {
                        terminal.paste(`${line}`);
                        terminal.write("\r\n");
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
            if (type !== "py") return;

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
