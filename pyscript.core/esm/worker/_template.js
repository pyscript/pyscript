// ⚠️ This file is used to generate xworker.js
//    That means if any import is circular or brings in too much
//    that would be a higher payload for every worker.
//    Please check via `npm run size` that worker code is not much
//    bigger than it used to be before any changes is applied to this file.

import coincident from "coincident/structured";

import { registry } from "../runtimes.js";
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

let engine, run, runtimeEvent;
const add = (type, fn) => {
    addEventListener(
        type,
        fn ||
            (async (event) => {
                const runtime = await engine;
                runtimeEvent = event;
                run(runtime, `xworker.on${type}(xworker.event);`, xworker);
            }),
        !!fn && { once: true },
    );
};

const xworker = {
    // allows synchronous utilities between this worker and the main thread
    sync: coincident(self),
    // standard worker related events / features
    onerror() {},
    onmessage() {},
    onmessageerror() {},
    postMessage: postMessage.bind(self),
    // this getter exists so that arbitrarily access to xworker.event
    // would always fail once an event has been dispatched, as that's not
    // meant to be accessed in the wild, respecting the one-off event nature of JS.
    get event() {
        const event = runtimeEvent;
        if (!event) throw new Error("Unauthorized event access");
        runtimeEvent = void 0;
        return event;
    },
};

add("message", ({ data: { options, code } }) => {
    engine = (async () => {
        const { type, version, config, async: isAsync } = options;
        const engine = await getRuntime(getRuntimeID(type, version), config);
        const details = registry.get(type);
        run = details[`runWorker${isAsync ? "Async" : ""}`].bind(details);
        run(engine, code, xworker);
        return engine;
    })();
    add("error");
    add("message");
    add("messageerror");
});
