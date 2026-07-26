import { typedSet } from "type-checked-collections";
import { dedent } from "polyscript/exports";
import toJSONCallback from "to-json-callback";

import { stdlib, optional } from "./stdlib.js";

export const main = (name) => hooks.main[name];
export const worker = (name) => hooks.worker[name];

const code = (hooks, branch, key, lib) => {
    hooks[key] = () => {
        const arr = lib ? [lib] : [];
        arr.push(...branch(key));
        return arr.map(dedent).join("\n");
    };
};

export const codeFor = (branch, type) => {
    const pylib = type === "mpy" ? stdlib.replace(optional, "") : stdlib;
    const hooks = {};
    code(hooks, branch, `codeBeforeRun`, pylib);
    code(hooks, branch, `codeBeforeRunAsync`, pylib);
    code(hooks, branch, `codeAfterRun`);
    code(hooks, branch, `codeAfterRunAsync`);
    return hooks;
};

export const createFunction = (self, name) => {
    const cbs = [...worker(name)];
    if (cbs.length) {
        const cb = toJSONCallback(
            self[`_${name}`] ||
                (name.endsWith("Async")
                    ? async (wrap, xworker, ...cbs) => {
                          for (const cb of cbs) await cb(wrap, xworker);
                      }
                    : (wrap, xworker, ...cbs) => {
                          for (const cb of cbs) cb(wrap, xworker);
                      }),
        );
        const a = cbs.map(toJSONCallback).join(", ");
        return Function(`return(w,x)=>(${cb})(w,x,...[${a}])`)();
    }
};

const SetFunction = typedSet({ typeof: "function" });
const SetString = typedSet({ typeof: "string" });

export const inputFailure = `
    import builtins
    def input(prompt=""):
        raise Exception("\\n           ".join([
            "input() doesn't work when PyScript runs in the main thread.",
            "Consider using the worker attribute: https://pyscript.github.io/docs/2023.11.2/user-guide/workers/"
        ]))

    builtins.input = input
    del builtins
    del input
`;

export const inputPatch = `
    import builtins, asyncio, inspect, sys
    inputs = input
    def _input(prompt=""):
        """Asks for user input"""
        result = inputs(str(prompt))
        if inspect.isawaitable(result):
            return asyncio.run(result)
        else:
            return result
    builtins.input = _input
    sys.input = inputs
    del sys, asyncio, inspect, builtins, inputs, _input
`;

export const syncAsync = `
    def a(coroutine):
        """Awaits coroutine"""
        from pyodide.ffi import can_run_sync as cRs, create_proxy as cP
        from asyncio import run as asynch
        try:
            if cRs():
                return asynch(coroutine)
        except (BaseException, Exception) as e:
            if "stack" in str(e).lower():
                pass
            else:
                raise
        async def coro_wrap():
            try:
                return False, await coroutine
            except (BaseException, Exception) as e:
                return True, e

        coro = cP(coro_wrap).callPromising(args)
        while not coro.done():
            time.sleep(.0825)
        status, info = coro.result()
        if status:
            raise info
        return info

    import asyncio
    from pyodide import ffi
    asyncio.run = a
    ffi.run_sync = a
    del a, ffi, asyncio
`;

export const hooks = {
    main: {
        /** @type {Set<function>} */
        onWorker: new SetFunction(),
        /** @type {Set<function>} */
        onReady: new SetFunction(),
        /** @type {Set<function>} */
        onBeforeRun: new SetFunction(),
        /** @type {Set<function>} */
        onBeforeRunAsync: new SetFunction(),
        /** @type {Set<function>} */
        onAfterRun: new SetFunction(),
        /** @type {Set<function>} */
        onAfterRunAsync: new SetFunction(),
        /** @type {Set<string>} */
        codeBeforeRun: new SetString([inputFailure]),
        /** @type {Set<string>} */
        codeBeforeRunAsync: new SetString(),
        /** @type {Set<string>} */
        codeAfterRun: new SetString(),
        /** @type {Set<string>} */
        codeAfterRunAsync: new SetString(),
    },
    worker: {
        /** @type {Set<function>} */
        onReady: new SetFunction(),
        /** @type {Set<function>} */
        onBeforeRun: new SetFunction(),
        /** @type {Set<function>} */
        onBeforeRunAsync: new SetFunction([
            ({ interpreter }) => {
                interpreter.registerJsModule("_pyscript", {
                    // cannot be imported from fs.js
                    // because this code is stringified
                    fs: {
                        ERROR: "storage permissions not granted",
                        NAMESPACE: "@pyscript.fs",
                    },
                    interpreter,
                });
            },
        ]),
        /** @type {Set<function>} */
        onAfterRun: new SetFunction(),
        /** @type {Set<function>} */
        onAfterRunAsync: new SetFunction(),
        /** @type {Set<string>} */
        codeBeforeRun: new SetString([inputPatch, syncAsync]),
        /** @type {Set<string>} */
        codeBeforeRunAsync: new SetString(),
        /** @type {Set<string>} */
        codeAfterRun: new SetString(),
        /** @type {Set<string>} */
        codeAfterRunAsync: new SetString(),
    },
};
