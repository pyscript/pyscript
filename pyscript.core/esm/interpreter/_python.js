import { clean, writeFile as writeFileUtil } from "./_utils.js";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export const run = (interpreter, code) => interpreter.runPython(clean(code));

export const runAsync = (interpreter, code) =>
    interpreter.runPythonAsync(clean(code));

export const setGlobal = (interpreter, name, value) =>
    interpreter.globals.set(name, value);

export const deleteGlobal = (interpreter, name) =>
    interpreter.globals.delete(name);

export const writeFile = ({ FS }, path, buffer) =>
    writeFileUtil(FS, path, buffer);
/* c8 ignore stop */
