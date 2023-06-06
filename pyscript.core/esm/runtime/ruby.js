import { clean, fetchPaths } from "./_utils.js";

const type = "ruby";

// MISSING:
//  * there is no VFS apparently or I couldn't reach any
//  * I've no idea how to override the stderr and stdout
//  * I've no idea how to import packages

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const worker = (method) =>
    function (runtime, code, xworker) {
        globalThis.xworker = xworker;
        return this[method](
            runtime,
            `require "js";xworker=JS::eval("return xworker");${code}`,
        );
    };

export default {
    experimental: true,
    type: [type, "rb"],
    module: (version = "2.0.0") =>
        `https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@${version}/dist/browser.esm.js`,
    async engine({ DefaultRubyVM }, config, url) {
        const response = await fetch(
            `${url.slice(0, url.lastIndexOf("/"))}/ruby.wasm`,
        );
        const module = await WebAssembly.compile(await response.arrayBuffer());
        const { vm: runtime } = await DefaultRubyVM(module);
        if (config.fetch) await fetchPaths(this, runtime, config.fetch);
        return runtime;
    },
    run: (runtime, code) => runtime.eval(clean(code)),
    runAsync: (runtime, code) => runtime.evalAsync(clean(code)),
    runEvent(runtime, code, key) {
        return this.run(
            runtime,
            `require "js";event=JS::eval("return __events.get(${key})");${code}`,
        );
    },
    runWorker: worker("run"),
    runWorkerAsync: worker("runAsync"),
    writeFile: () => {
        throw new Error(`writeFile is not supported in ${type}`);
    },
};
/* c8 ignore stop */
