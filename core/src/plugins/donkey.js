import addPromiseListener from "add-promise-listener";
import { assign, dedent } from "polyscript/exports";

const { stringify } = JSON;

const invoke = (name, args) => `${name}(code, ${args.join(", ")})`;

const donkey = ({ type = "py", persistent, terminal, config }) => {
    const args = persistent ? ["globals()", "__locals__"] : ["{}", "{}"];

    const src = URL.createObjectURL(
        new Blob([
            [
                // this array is to better minify this code once in production
                "from pyscript import sync, config",
                '__message__ = lambda e,v: f"\x1b[31m\x1b[1m{e.__name__}\x1b[0m: {v}"',
                "__locals__ = {}",
                'if config["type"] == "py":',
                "	import sys",
                "	def __error__(_):",
                "		info = sys.exc_info()",
                "		return __message__(info[0], info[1])",
                "else:",
                "	__error__ = lambda e: __message__(e.__class__, e.value)",
                "def execute(code):",
                `	try: return ${invoke("exec", args)};`,
                "	except Exception as e: print(__error__(e));",
                "def evaluate(code):",
                `	try: return ${invoke("eval", args)};`,
                "	except Exception as e: print(__error__(e));",
                "sync.execute = execute",
                "sync.evaluate = evaluate",
            ].join("\n"),
        ]),
    );

    // create the script that exposes the code to execute or evaluate
    const script = assign(document.createElement("script"), { type, src });
    script.toggleAttribute("worker", true);
    script.toggleAttribute("terminal", true);
    if (terminal) script.setAttribute("target", terminal);
    if (config) {
        script.setAttribute(
            "config",
            typeof config === "string" ? config : stringify(config),
        );
    }

    return addPromiseListener(
        document.body.appendChild(script),
        `${type}:done`,
        { stopPropagation: true },
    ).then(() => {
        URL.revokeObjectURL(src);
        return script;
    });
};

const utils = async (options) => {
    const script = await donkey(options);
    const { xworker, process, terminal } = script;
    const { execute, evaluate } = xworker.sync;
    script.remove();
    return {
        xworker,
        process,
        terminal,
        execute,
        evaluate,
    };
};

export default async (options = {}) => {
    let farmer = await utils(options);
    let working = false;
    const kill = () => {
        if (farmer) {
            farmer.xworker.terminate();
            farmer.terminal.dispose();
            farmer = null;
        }
        working = false;
    };
    const reload = async () => {
        kill();
        farmer = await utils(options);
    };
    const asyncTask = (method) => async (code) => {
        // race condition ... a new task has been
        // assigned while the previous one didn't finish
        if (working) await reload();
        working = true;
        try {
            return await farmer[method](dedent(code));
        } catch (e) {
            console.error(e);
        } finally {
            working = false;
        }
    };
    const asyncMethod = (method) => async () => {
        if (working) await reload();
        else farmer?.terminal[method]();
    };
    return {
        process: asyncTask("process"),
        execute: asyncTask("execute"),
        evaluate: asyncTask("evaluate"),
        clear: asyncMethod("clear"),
        reset: asyncMethod("reset"),
        kill,
    };
};
