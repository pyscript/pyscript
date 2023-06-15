import { clean, fetchPaths, stdio, writeFileShim } from "./_utils.js";

const type = "wasmoon";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const worker = (method) =>
    function (interpreter, code, xworker) {
        interpreter.global.set("xworker", xworker);
        return this[method](interpreter, code);
    };

export default {
    type: [type, "lua"],
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
    run: (interpreter, code) => interpreter.doStringSync(clean(code)),
    runAsync: (interpreter, code) => interpreter.doString(clean(code)),
    runEvent(interpreter, code, key) {
        interpreter.global.set("event", globalThis.__events.get(key));
        return this.run(interpreter, code);
    },
    runWorker: worker("run"),
    runWorkerAsync: worker("runAsync"),
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
