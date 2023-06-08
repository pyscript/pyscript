import { fetchPaths, stdio } from "./_utils.js";
import {
    run,
    runAsync,
    runEvent,
    runWorker,
    runWorkerAsync,
    writeFile,
} from "./_python.js";

const type = "pyodide";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type: [type, "py"],
    module: (version = "0.23.2") =>
        `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`,
    async engine({ loadPyodide }, config, url) {
        const { stderr, stdout, get } = stdio();
        const indexURL = url.slice(0, url.lastIndexOf('/'));
        const runtime = await get(loadPyodide({ stderr, stdout, indexURL }));
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        if (config.packages) {
            await runtime.loadPackage("micropip");
            const micropip = await runtime.pyimport("micropip");
            await micropip.install(config.packages);
            micropip.destroy();
        }
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
