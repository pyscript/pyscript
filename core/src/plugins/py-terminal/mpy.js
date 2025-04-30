// PyScript pyodide terminal plugin
import withResolvers from "@webreflection/utils/with-resolvers";
import { defineProperties } from "polyscript/exports";
import { hooks, inputFailure } from "../../core.js";

const bootstrapped = new WeakSet();

// this callback will be serialized as string and it never needs
// to be invoked multiple times. Each xworker here is bootstrapped
// only once thanks to the `sync.is_pyterminal()` check.
const workerReady = ({ interpreter, io, run, type }, { sync }) => {
    if (type !== "mpy" || !sync.is_pyterminal()) return;

    const { pyterminal_ready, pyterminal_read, pyterminal_write } = sync;

    interpreter.registerJsModule("_pyscript_input", {
        input: pyterminal_read,
    });

    run(
        [
            "from _pyscript_input import input",
            "from polyscript import currentScript as _",
            "__terminal__ = _.terminal",
            "del _",
        ].join(";"),
    );

    const missingReturn = new Uint8Array([13]);
    io.stdout = (buffer) => {
        if (buffer[0] === 10) pyterminal_write(missingReturn);
        pyterminal_write(buffer);
    };
    io.stderr = (error) => {
        pyterminal_write(String(error.message || error));
    };

    sync.pyterminal_stream_write = () => {};

    // tiny shim of the code module with only interact
    // to bootstrap a REPL like environment
    interpreter.registerJsModule("code", {
        interact() {
            const encoder = new TextEncoderStream();
            encoder.readable.pipeTo(
                new WritableStream({
                    write(buffer) {
                        for (const c of buffer) interpreter.replProcessChar(c);
                    },
                }),
            );

            const writer = encoder.writable.getWriter();
            sync.pyterminal_stream_write = (buffer) => writer.write(buffer);

            interpreter.replInit();
        },
    });

    pyterminal_ready();
};

export default async (element) => {
    // lazy load these only when a valid terminal is found
    const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import(/* webpackIgnore: true */ "../../3rd-party/xterm.js"),
        import(/* webpackIgnore: true */ "../../3rd-party/xterm_addon-fit.js"),
        import(
            /* webpackIgnore: true */ "../../3rd-party/xterm_addon-web-links.js"
        ),
    ]);

    const terminalOptions = {
        disableStdin: false,
        cursorBlink: true,
        cursorStyle: "block",
        lineHeight: 1.2,
    };

    let stream;

    // common main thread initialization for both worker
    // or main case, bootstrapping the terminal on its target
    const init = () => {
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
            ...terminalOptions,
        });
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(new WebLinksAddon());
        terminal.open(target);
        fitAddon.fit();
        terminal.focus();
        defineProperties(element, {
            terminal: { value: terminal },
            process: {
                value: async (code) => {
                    for (const line of code.split(/(?:\r\n|\r|\n)/)) {
                        await stream.write(`${line}\r`);
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

            const terminal = init();

            const { sync } = xworker;

            // handle the read mode on input
            let promisedChunks = null;
            let readChunks = "";

            sync.is_pyterminal = () => true;

            // put the terminal in a read-only state
            // frees the worker on \r
            sync.pyterminal_read = (buffer) => {
                terminal.write(buffer);
                promisedChunks = withResolvers();
                return promisedChunks.promise;
            };

            // write if not reading input
            sync.pyterminal_write = (buffer) => {
                if (!promisedChunks) terminal.write(buffer);
            };

            // add the onData terminal listener which forwards to the worker
            // everything typed in a queued char-by-char way
            sync.pyterminal_ready = () => {
                let queue = Promise.resolve();
                stream = {
                    write: (buffer) =>
                        (queue = queue.then(() =>
                            sync.pyterminal_stream_write(buffer),
                        )),
                };
                terminal.onData((buffer) => {
                    if (promisedChunks) {
                        // handle backspace on input
                        if (buffer === "\x7f") {
                            // avoid over-greedy backspace
                            if (readChunks.length) {
                                readChunks = readChunks.slice(0, -1);
                                // override previous char position
                                // put an empty space to clear the char
                                // move back position again
                                buffer = "\b \b";
                            } else buffer = "";
                        } else readChunks += buffer;
                        if (buffer) {
                            terminal.write(buffer);
                            if (readChunks.endsWith("\r")) {
                                terminal.write("\n");
                                promisedChunks.resolve(readChunks.slice(0, -1));
                                promisedChunks = null;
                                readChunks = "";
                            }
                        }
                    } else {
                        stream.write(buffer);
                    }
                });
            };
        });

        // setup remote thread JS/Python code for whenever the
        // worker is ready to become a terminal
        hooks.worker.onReady.add(workerReady);
    } else {
        // ⚠️ In an ideal world the inputFailure should never be used on main.
        //    However, Pyodide still can't compete with MicroPython REPL mode
        //    so while it's OK to keep that entry on main as default, we need
        //    to remove it ASAP from `mpy` use cases, otherwise MicroPython would
        //    also throw whenever an `input(...)` is required / digited.
        hooks.main.codeBeforeRun.delete(inputFailure);

        // in the main case, just bootstrap XTerm without
        // allowing any input as that's not possible / awkward
        hooks.main.onReady.add(function main({ interpreter, io, run, type }) {
            if (type !== "mpy") return;

            hooks.main.onReady.delete(main);

            const terminal = init();

            const missingReturn = new Uint8Array([13]);
            io.stdout = (buffer) => {
                if (buffer[0] === 10) terminal.write(missingReturn);
                terminal.write(buffer);
            };

            // expose the __terminal__ one-off reference
            globalThis.__py_terminal__ = terminal;
            run(
                [
                    "from js import prompt as input",
                    "from js import __py_terminal__ as __terminal__",
                ].join(";"),
            );
            delete globalThis.__py_terminal__;

            // NOTE: this is NOT the same as the one within
            //       the onWorkerReady callback!
            interpreter.registerJsModule("code", {
                interact() {
                    const encoder = new TextEncoderStream();
                    encoder.readable.pipeTo(
                        new WritableStream({
                            write(buffer) {
                                for (const c of buffer)
                                    interpreter.replProcessChar(c);
                            },
                        }),
                    );

                    stream = encoder.writable.getWriter();
                    terminal.onData((buffer) => stream.write(buffer));

                    interpreter.replInit();
                },
            });
        });
    }
};
