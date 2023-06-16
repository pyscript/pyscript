import { clean, fetchPaths, stdio, writeFileShim } from "./_utils.js";

const type = "wasmoon";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    module: (version = "1.15.0") =>
        `https://cdn.jsdelivr.net/npm/wasmoon@${version}/+esm`,
    async engine({ LuaFactory, LuaLibraries }, config) {
        const { stderr, stdout, get } = stdio();
        const interpreter = await get(new LuaFactory().createEngine());
        interpreter.global.getTable(LuaLibraries.Base, (index) => {
            interpreter.global.setField(index, "print", stdout);
            interpreter.global.setField(index, "printErr", stderr);
        });
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal(interpreter, name, value) {
        interpreter.global.set(name, value);
    },
    deleteGlobal(interpreter, name) {
        interpreter.global.set(name, void 0);
    },
    run: (interpreter, code) => interpreter.doStringSync(clean(code)),
    runAsync: (interpreter, code) => interpreter.doString(clean(code)),
    writeFile: (
        {
            cmodule: {
                module: { FS },
            },
        },
        path,
        buffer,
    ) => writeFileShim(FS, path, buffer),
};
/* c8 ignore stop */
