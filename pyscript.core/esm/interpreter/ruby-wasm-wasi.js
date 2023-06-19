import { clean, fetchPaths } from "./_utils.js";

const type = "ruby-wasm-wasi";

// MISSING:
//  * there is no VFS apparently or I couldn't reach any
//  * I've no idea how to override the stderr and stdout
//  * I've no idea how to import packages

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export default {
    type,
    experimental: true,
    module: (version = "2.0.0") =>
        `https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${version}/dist/browser.esm.js`,
    async engine({ DefaultRubyVM }, config, url) {
        const response = await fetch(
            `${url.slice(0, url.lastIndexOf("/"))}/ruby.wasm`,
        );
        const module = await WebAssembly.compile(await response.arrayBuffer());
        const { vm: interpreter } = await DefaultRubyVM(module);
        if (config.fetch) await fetchPaths(this, interpreter, config.fetch);
        return interpreter;
    },
    setGlobal(interpreter, name, value) {
        const id = `__pyscript_ruby_wasm_wasi_${name}`;
        globalThis[id] = value;
        this.run(interpreter, `require "js";$${name}=JS::eval("return ${id}")`);
    },
    deleteGlobal(interpreter, name) {
        const id = `__pyscript_ruby_wasm_wasi_${name}`;
        this.run(interpreter, `$${name}=nil`);
        delete globalThis[id];
    },
    run: (interpreter, code) => interpreter.eval(clean(code)),
    runAsync: (interpreter, code) => interpreter.evalAsync(clean(code)),
    writeFile: () => {
        throw new Error(`writeFile is not supported in ${type}`);
    },
};
/* c8 ignore stop */
