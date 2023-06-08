import { clean, writeFile as writeFileUtil } from "./_utils.js";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export const run = (runtime, code) => runtime.runPython(clean(code));

export const runAsync = (runtime, code) => runtime.runPythonAsync(clean(code));

export function runEvent(runtime, code, key) {
    code = `import js;event=js.__events.get(${key});${code}`;
    return this.run(runtime, code);
}

const worker = (method) =>
    function (runtime, code, xworker) {
        code = `from js import xworker;${code}`;
        globalThis.xworker = xworker;
        return this[method](runtime, code);
    };

export const runWorker = worker("run");

export const runWorkerAsync = worker("runAsync");

export const writeFile = ({ FS }, path, buffer) =>
    writeFileUtil(FS, path, buffer);
/* c8 ignore stop */
