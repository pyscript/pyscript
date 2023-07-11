import { clean, fetchPaths, stdio, writeFileShim } from "./_utils.js";

import { entries } from "../utils.js";

const type = "wasmoon";

// MISSING:
//  * I've no idea how to import packages

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    module: (version = "1.15.0") =>
        `https://cdn.jsdelivr.net/npm/wasmoon@${version}/+esm`,
    async engine({ LuaFactory, LuaLibraries }, config) {
        const { stderr, stdout, get } = stdio();
        const interpreter = await get(new LuaFactory().createEngine());
        interpreter.global.getTable(LuaLibraries.Base, (index) => {
            interpreter.global.setField(index, "print", stdout);
            interpreter.global.setField(index, "printErr", stderr);
        });
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    // Fallback to globally defined module fields
    registerJSModule: (interpreter, _, value) => {
        for (const [k, v] of entries(value)) interpreter.global.set(k, v);
    },
    run: (interpreter, code) => interpreter.doStringSync(clean(code)),
    runAsync: (interpreter, code) => interpreter.doString(clean(code)),
    runEvent: async (interpreter, code, event) => {
        // allows method(event) as well as namespace.method(event)
        // it does not allow fancy brackets names for now
        const [name, ...keys] = code.split(".");
        let target = interpreter.global.get(name);
        let context;
        for (const key of keys) [context, target] = [target, target[key]];
        await target.call(context, event);
    },
    writeFile: (
        {
            cmodule: {
                module: { FS },
            },
        },
        path,
        buffer,
    ) => writeFileShim(FS, path, buffer),
};
/* c8 ignore stop */
