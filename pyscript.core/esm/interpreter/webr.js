import { fetchPaths, stdio, writeFile } from "./_utils.js";

const type = "webr";

const io = new WeakMap();

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    experimental: true,
    module: (version = "0.1.1") =>
        `https://webr.r-wasm.org/v${version}/webr.mjs`,
    async engine({ WebR }, config) {
        const { stderr, stdout, get } = stdio();
        const webR = new WebR();
        await webR.init();
        const interpreter = await get(new webR.Shelter());
        io.set(interpreter, { webR, stderr, stdout });
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal() {
        // UNSUPPORTED
        // const { webR } = io.get(interpreter);
        // return webR.objs.globalEnv.bind(name, value);
    },
    deleteGlobal() {
        // UNSUPPORTED
        // const { webR } = io.get(interpreter);
        // return webR.objs.globalEnv.bind(name, void 0);
    },
    run(interpreter, code) {
        return this.runAsync(interpreter, code);
    },
    async runAsync(interpreter, code) {
        const ioHandler = io.get(interpreter);
        const { output, result } = await interpreter.captureR(code);
        for (const { type, data } of output) ioHandler[type](data);
        return result;
    },
    writeFile: (interpreter, path, buffer) => {
        const { webR } = io.get(interpreter);
        return writeFile(webR.FS, path, buffer);
    },
};
/* c8 ignore stop */
