import { fetchPaths, stdio } from "./_utils.js";
import {
    run,
    runAsync,
    runEvent,
    runWorker,
    runWorkerAsync,
    writeFile,
} from "./_python.js";

const type = "micropython";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type: [type, "mpy"],
    module: () => `http://localhost:8080/micropython/micropython.mjs`,
    async engine({ loadMicroPython }, config, url) {
        const { stderr, stdout, get } = stdio();
        url = url.replace(/\.m?js$/, ".wasm");
        const runtime = await get(loadMicroPython({ stderr, stdout, url }));
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        return runtime;
    },
    run,
    runAsync,
    runEvent,
    runWorker,
    runWorkerAsync,
    writeFile,
};
/* c8 ignore stop */
