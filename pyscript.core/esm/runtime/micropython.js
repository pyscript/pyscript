import { fetchPaths, stdio, writeFile } from "./_utils.js";

const type = "micropython";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const worker = (method) =>
    function (runtime, code, xworker) {
        globalThis.xworker = xworker;
        return this[method](runtime, `from js import xworker;${code}`);
    };

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
