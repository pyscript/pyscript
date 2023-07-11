import { clean, writeFile as writeFileUtil } from "./_utils.js";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export const registerJSModule = (interpreter, name, value) => {
    interpreter.registerJsModule(name, value);
};

export const run = (interpreter, code) => interpreter.runPython(clean(code));

export const runAsync = (interpreter, code) =>
    interpreter.runPythonAsync(clean(code));

export const runEvent = async (interpreter, code, event) => {
    // allows method(event) as well as namespace.method(event)
    // it does not allow fancy brackets names for now
    const [name, ...keys] = code.split(".");
    let target = interpreter.globals.get(name);
    let context;
    for (const key of keys) [context, target] = [target, target[key]];
    await target.call(context, event);
};

export const writeFile = ({ FS }, path, buffer) =>
    writeFileUtil(FS, path, buffer);
/* c8 ignore stop */
