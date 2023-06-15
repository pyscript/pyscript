import { clean, writeFile as writeFileUtil } from "./_utils.js";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export const run = (interpreter, code) => interpreter.runPython(clean(code));

export const runAsync = (interpreter, code) =>
    interpreter.runPythonAsync(clean(code));

export function runEvent(interpreter, code, key) {
    code = `import js;event=js.__events.get(${key});${code}`;
    return this.run(interpreter, code);
}

const worker = (method) =>
    function (interpreter, code, xworker) {
        code = `from js import xworker;${code}`;
        globalThis.xworker = xworker;
        return this[method](interpreter, code);
    };

export const runWorker = worker("run");

export const runWorkerAsync = worker("runAsync");

export const writeFile = ({ FS }, path, buffer) =>
    writeFileUtil(FS, path, buffer);
/* c8 ignore stop */
