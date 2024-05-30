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
        onBeforeRunAsync: new SetFunction(),
        /** @type {Set<function>} */
        onAfterRun: new SetFunction(),
        /** @type {Set<function>} */
        onAfterRunAsync: new SetFunction(),
        /** @type {Set<string>} */
        codeBeforeRun: new SetString(),
        /** @type {Set<string>} */
        codeBeforeRunAsync: new SetString(),
        /** @type {Set<string>} */
        codeAfterRun: new SetString(),
        /** @type {Set<string>} */
        codeAfterRunAsync: new SetString(),
    },
};
