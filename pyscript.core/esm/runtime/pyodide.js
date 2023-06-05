import { fetchPaths, stdio, writeFile } from "./_utils.js";

const type = "pyodide";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const worker = (method) =>
    function (runtime, code, xworker) {
        globalThis.xworker = xworker;
        return this[method](runtime, `from js import xworker;${code}`);
    };

export default {
    type: [type, "py"],
    module: (version = "0.22.1") =>
        `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`,
    async engine({ loadPyodide }, config) {
        const { stderr, stdout, get } = stdio();
        const runtime = await get(loadPyodide({ stderr, stdout }));
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        if (config.packages) {
            await runtime.loadPackage("micropip");
            const micropip = await runtime.pyimport("micropip");
            await micropip.install(config.packages);
            micropip.destroy();
        }
        return runtime;
    },
    run: (runtime, code) => runtime.runPython(code),
    runAsync: (runtime, code) => runtime.runPythonAsync(code),
    runEvent(runtime, code, key) {
        return this.run(
            runtime,
            `import js;event=js.__events.get(${key});${code}`,
        );
    },
    runWorker: worker("run"),
    runWorkerAsync: worker("runAsync"),
    writeFile: ({ FS }, path, buffer) => writeFile(FS, path, buffer),
};
/* c8 ignore stop */
