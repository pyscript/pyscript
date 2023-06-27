import { fetchPaths, stdio } from "./_utils.js";
import { run, setGlobal, deleteGlobal, writeFile } from "./_python.js";

const type = "micropython";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    module: (version = "1.20.0-268") =>
        `https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${version}/micropython.mjs`,
    async engine({ loadMicroPython }, config, url) {
        const { stderr, stdout, get } = stdio();
        url = url.replace(/\.m?js$/, ".wasm");
        const interpreter = await get(loadMicroPython({ stderr, stdout, url }));
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal,
    deleteGlobal,
    run,
    // TODO: MicroPython doesn't have a Pyodide like top-level await,
    //       this method should still not throw errors once invoked
    async runAsync(...args) {
        return this.run(...args);
    },
    writeFile,
};
/* c8 ignore stop */
