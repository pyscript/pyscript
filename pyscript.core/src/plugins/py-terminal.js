// PyScript py-terminal plugin
import { hooks } from "../core.js";

// XXX TODO:
// 1. these imports should be lazy?
// 2. would be nice to automatically add xterm.css on demand
import { Terminal } from "https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm";
import { Readline } from "https://cdn.jsdelivr.net/npm/xterm-readline@1.1.1/+esm";
const makePyTerminal = () => {
    const element = document.querySelector("py-terminal");
    if (element === null) {
        return false;
    }

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

    async function readline(prompt) {
        //console.log("readline", prompt);
        const line = await rl.read(prompt);
        return line;
    }

    async function write(line) {
        //console.log("write", line);
        rl.write(line);
    }

    console.log("PyTerminal made?");
    return { term, readline, write };
};

// this is ONLY for non-workers, correct?
// TODO: how to make it working for workers?
hooks.onInterpreterReady.add(function override(pyScript) {
    console.log("hello onInterpreterReady");
    const t = makePyTerminal();
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

hooks.onWorkerReady.add(function (_, xworker) {
    console.log("hello onWorkerReady");
    const t = makePyTerminal();
    if (!t) {
        console.log("<py-terminal> not found, nothing to do");
        return;
    }

    xworker.sync.pyterminal_readline = t.readline;
    xworker.sync.pyterminal_write = t.write;
});
