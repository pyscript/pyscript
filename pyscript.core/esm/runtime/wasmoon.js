import { clean, fetchPaths, stdio, writeFileShim } from "./_utils.js";

const type = "wasmoon";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const worker = (method) =>
    function (runtime, code, xworker) {
        runtime.global.set("xworker", xworker);
        return this[method](runtime, code);
    };

export default {
    type: [type, "lua"],
    module: (version = "1.15.0") =>
        `https://cdn.jsdelivr.net/npm/wasmoon@${version}/+esm`,
    async engine({ LuaFactory, LuaLibraries }, config) {
        const { stderr, stdout, get } = stdio();
        const runtime = await get(new LuaFactory().createEngine());
        runtime.global.getTable(LuaLibraries.Base, (index) => {
            runtime.global.setField(index, "print", stdout);
            runtime.global.setField(index, "printErr", stderr);
        });
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        return runtime;
    },
    run: (runtime, code) => runtime.doStringSync(clean(code)),
    runAsync: (runtime, code) => runtime.doString(clean(code)),
    runEvent(runtime, code, key) {
        runtime.global.set("event", globalThis.__events.get(key));
        return this.run(runtime, code);
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
