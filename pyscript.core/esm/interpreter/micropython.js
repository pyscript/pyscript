import { fetchPaths, stdio } from "./_utils.js";
import { run, runAsync, writeFile } from "./_python.js";

const type = "micropython";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    module: (version = "1.20.0-239") =>
        `https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${version}/micropython.mjs`,
    async engine({ loadMicroPython }, config, url) {
        const { stderr, stdout, get } = stdio();
        url = url.replace(/\.m?js$/, ".wasm");
        const runtime = await get(loadMicroPython({ stderr, stdout, url }));
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        return runtime;
    },
    setGlobal(interpreter, name, value) {
        const id = `__pyscript_${this.type}_${name}`;
        globalThis[id] = value;
        this.run(interpreter, `from js import ${id};${name}=${id};`);
    },
    deleteGlobal(interpreter, name) {
        const id = `__pyscript_${this.type}_${name}`;
        this.run(interpreter, `del ${id};del ${name}`);
        delete globalThis[id];
    },
    run,
    runAsync,
    writeFile,
};
/* c8 ignore stop */
