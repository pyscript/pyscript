import { fetchPaths, stdio, writeFile } from "./_utils.js";
import { registerJSModule, run, runAsync, runEvent } from "./_python.js";

const type = "pyodide";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    module: (version = "0.23.2") =>
        `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`,
    async engine({ loadPyodide }, config, url) {
        const { stderr, stdout, get } = stdio();
        const indexURL = url.slice(0, url.lastIndexOf("/"));
        const interpreter = await get(
            loadPyodide({ stderr, stdout, indexURL }),
        );
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        if (config.packages) {
            await interpreter.loadPackage("micropip");
            const micropip = await interpreter.pyimport("micropip");
            await micropip.install(config.packages);
            micropip.destroy();
        }
        return interpreter;
    },
    registerJSModule,
    run,
    runAsync,
    runEvent,
    writeFile: ({ FS, PATH, _module: { PATH_FS } }, path, buffer) =>
        writeFile({ FS, PATH, PATH_FS }, path, buffer),
};
/* c8 ignore stop */
