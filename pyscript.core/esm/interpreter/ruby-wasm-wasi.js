import { clean, fetchPaths } from "./_utils.js";
import { entries } from "../utils.js";

const type = "ruby-wasm-wasi";
const jsType = type.replace(/\W+/g, "_");

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
    // Fallback to globally defined module fields (i.e. $xworker)
    registerJSModule(interpreter, _, value) {
        const code = ['require "js"'];
        for (const [k, v] of entries(value)) {
            const id = `__module_${jsType}_${k}`;
            globalThis[id] = v;
            code.push(`$${k}=JS.global[:${id}]`);
        }
        this.run(interpreter, code.join(";"));
    },
    run: (interpreter, code) => interpreter.eval(clean(code)),
    runAsync: (interpreter, code) => interpreter.evalAsync(clean(code)),
    runEvent(interpreter, code, event) {
        // patch common xworker.onmessage/onerror cases
        if (/^xworker\.(on\w+)$/.test(code)) {
            const { $1: name } = RegExp;
            const id = `__module_${jsType}_event`;
            globalThis[id] = event;
            this.run(
                interpreter,
                `require "js";$xworker.call("${name}",JS.global[:${id}])`,
            );
            delete globalThis[id];
        } else {
            // Experimental: allows only events by fully qualified method name
            const method = this.run(interpreter, `method(:${code})`);
            method.call(code, interpreter.wrap(event));
        }
    },
    writeFile: () => {
        throw new Error(`writeFile is not supported in ${type}`);
    },
};
/* c8 ignore stop */
