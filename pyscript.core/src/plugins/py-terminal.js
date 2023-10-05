// PyScript py-terminal plugin
import { hooks } from "../core.js";

const makePyTerminal = async () => {
    const element = document.querySelector("py-terminal");
    if (element === null) {
        // no py-terminal found, nothing to do
        return false;
    }

    document
        .getElementsByTagName("head")[0]
        .insertAdjacentHTML(
            "beforeend",
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css">',
        );
    const { Terminal } = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm"
    );
    const { Readline } = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/xterm-readline@1.1.1/+esm"
    );

    const term = new Terminal({
        theme: {
            background: "#191A19",
            foreground: "#F5F2E7",
        },
        cursorBlink: true,
        cursorStyle: "block",
        rows: 50,
    });

    const rl = new Readline();
    term.loadAddon(rl);
    term.open(element);
    term.focus();

    async function pyterminal_readline(prompt) {
        const line = await rl.read(prompt);
        return line;
    }

    async function pyterminal_write(line) {
        rl.write(line);
    }

    console.log("PyTerminal made?");
    return { term, pyterminal_readline, pyterminal_write };
};

// this is ONLY for non-workers, correct?
// TODO: how to make it working for workers?
hooks.onInterpreterReady.add(async function override(pyScript) {
    console.log("hello onInterpreterReady");
    const t = await makePyTerminal();
    if (!t) {
        console.log("<py-terminal> not found, nothing to do");
        return;
    }
    // XXX: we should investigate pyodide "write handler", it should be more
    // efficient:
    // https://pyodide.org/en/stable/usage/streams.html#a-write-handler
    //
    // Also: should the stdout/stderr go ALSO to the JS console?
    function myStdout(byte) {
        t.write(String.fromCharCode(byte));
    }
    const pyodide = pyScript.interpreter;
    pyodide.setStdout({ raw: myStdout });
    pyodide.setStderr({ raw: myStdout });
});

hooks.onWorkerReady.add(async function (_, xworker) {
    console.log("hello onWorkerReady");
    const t = await makePyTerminal();
    if (!t) {
        console.log("<py-terminal> not found, nothing to do");
        return;
    }
    xworker.sync.pyterminal_readline = t.pyterminal_readline;
    xworker.sync.pyterminal_write = t.pyterminal_write;
});

hooks.codeBeforeRunWorker.add(`
from pyscript import pyterminal
pyterminal.init()
`);
