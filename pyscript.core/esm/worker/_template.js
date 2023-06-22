// ⚠️ This file is used to generate xworker.js
//    That means if any import is circular or brings in too much
//    that would be a higher payload for every worker.
//    Please check via `npm run size` that worker code is not much
//    bigger than it used to be before any changes is applied to this file.

import * as JSON from "@ungap/structured-clone/json";
import coincident from "coincident/window";

import { create } from "../utils.js";
import { registry } from "../interpreters.js";
import { getRuntime, getRuntimeID } from "../loader.js";

// bails out out of the box with a native/meaningful error
// in case the SharedArrayBuffer is not available
try {
    new SharedArrayBuffer(4);
} catch (_) {
    throw new Error(
        [
            "Unable to use SharedArrayBuffer due insecure environment.",
            "Please read requirements in MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements",
        ].join("\n"),
    );
}

let interpreter, run, interpreterEvent;
const add = (type, fn) => {
    addEventListener(
        type,
        fn ||
            (async (event) => {
                await interpreter;
                interpreterEvent = event;
                run(`xworker.on${type}(xworker.event);`, xworker);
            }),
        !!fn && { once: true },
    );
};

const { proxy: sync, window, isWindowProxy } = coincident(self, JSON);

const xworker = {
    // allows synchronous utilities between this worker and the main thread
    sync,
    // allow access to the main thread world
    window,
    // allow introspection for foreign (main thread) refrences
    isWindowProxy,
    // standard worker related events / features
    onerror() {},
    onmessage() {},
    onmessageerror() {},
    postMessage: postMessage.bind(self),
    // this getter exists so that arbitrarily access to xworker.event
    // would always fail once an event has been dispatched, as that's not
    // meant to be accessed in the wild, respecting the one-off event nature of JS.
    // because xworker is a unique well defined globally shared reference,
    // there's also no need to bother setGlobal and deleteGlobal every single time.
    get event() {
        const event = interpreterEvent;
        if (!event) throw new Error("Unauthorized event access");
        interpreterEvent = void 0;
        return event;
    },
};

add("message", ({ data: { options, code, hooks } }) => {
    interpreter = (async () => {
        const { type, version, config, async: isAsync } = options;
        const interpreter = await getRuntime(
            getRuntimeID(type, version),
            config,
        );
        const details = create(registry.get(type));
        const name = `run${isAsync ? "Async" : ""}`;

        if (hooks) {
            // patch code if needed
            const { beforeRun, beforeRunAsync, afterRun, afterRunAsync } =
                hooks;

            const after = afterRun || afterRunAsync;
            const before = beforeRun || beforeRunAsync;

            // append code that should be executed *after* first
            if (after) {
                const method = details[name].bind(details);
                details[name] = (interpreter, code) =>
                    method(interpreter, `${code}\n${after}`);
            }

            // prepend code that should be executed *before* (so that after is post-patched)
            if (before) {
                const method = details[name].bind(details);
                details[name] = (interpreter, code) =>
                    method(interpreter, `${before}\n${code}`);
            }
        }
        // set the `xworker` global reference once
        details.setGlobal(interpreter, "xworker", xworker);
        // simplify run calls after possible patches
        run = details[name].bind(details, interpreter);
        // execute the content of the worker file
        run(code);
        return interpreter;
    })();
    add("error");
    add("message");
    add("messageerror");
});
