// PyScript py-terminal plugin
import { hooks } from "../core.js";

// XXX TODO:
// 1. these imports should be lazy?
// 2. would be nice to automatically add xterm.css on demand
import { Terminal } from 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm'
import { Readline } from 'https://cdn.jsdelivr.net/npm/xterm-readline@1.1.1/+esm'
const makePyTerminal = () => {
    const element = document.querySelector('py-terminal');
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
        rows: 50
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
}

// this is ONLY for non-workers, correct?
// TODO: how to make it working for workers?
hooks.onInterpreterReady.add(function override(pyScript) {
    console.log("hello onInterpreterReady");
    const t = makePyTerminal();
    if (!t) {
        console.log("<py-terminal> not found, nothing to do");
        return;
    }
    const { stdout, stderr } = pyScript.io;

    pyScript.io.stdout = (s, ...rest) => {
        // XXX: the + "\n" is conceptually wrong.
        // We probably need to configure pyodide's stdout as "raw mode"
        // instead of "batched mode":
        // https://pyodide.org/en/stable/usage/streams.html#a-raw-handler
        t.write(s + "\n");
        stdout(s, ...rest);
    }

    pyScript.io.stderr = (s, ...rest) => {
        t.write(s + "\n"); // see above for the "\n"
        stderr(s, ...rest);
    }
});


// this is mostly pseudo-code for what it *should* happen for the workers case
/*
addEventListener("py:ready", (event) => {
    console.log("hello py:ready");
    if (!event.detail.worker) {
        return;
    }

    const t = makePyTerminal();
    if (!t) {
        console.log("<py-terminal> not found, nothing to do");
        return;
    }

    const xworker = event.target.xworker;

    xworker.sync.pyterminal_readline = t.readline;
    xworker.sync.pyterminal_write = t.write;

    // XXX: I know that the following lines don't work, but this is more or
    // lesswhat I would like to happen
    pyScript.io.stdout = (s, ...rest) => {
        // this is JS code, and we cannot send arbitrary JS code from the main
        // to the worker. So maybe a solution is to hardcode this logic
        // directly inside the worker code?
        xworker.sync.pyterminal_write(s);
    }
    pyScript.io.stderr = (s, ...rest) => {
        xworker.sync.pyterminal_write(s);
    }
    something.runPython(`
        import builtins
        import pyscript
        builtins.input = sync.pyterminal_readline
    `)

});
*/
