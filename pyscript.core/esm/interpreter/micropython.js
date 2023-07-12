import { fetchPaths, stdio } from "./_utils.js";
import {
    registerJSModule,
    run,
    runAsync,
    runEvent,
    writeFile,
} from "./_python.js";

const type = "micropython";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    module: (version = "1.20.0-295") =>
        `https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@${version}/micropython.mjs`,
    async engine({ loadMicroPython }, config, url) {
        const { stderr, stdout, get } = stdio();
        url = url.replace(/\.m?js$/, ".wasm");
        const interpreter = await get(loadMicroPython({ stderr, stdout, url }));
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    registerJSModule,
    run,
    runAsync,
    runEvent,
    writeFile,
};
/* c8 ignore stop */
