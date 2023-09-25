import TYPES from "./types.js";
import hooks from "./hooks.js";

const DONE = "py:all-done";

const {
    onAfterRun,
    onAfterRunAsync,
    codeAfterRunWorker,
    codeAfterRunWorkerAsync,
} = hooks;

const waitForIt = [];
const codes = [];

const codeFor = (element) => {
    const isAsync = element.hasAttribute("async");
    const { promise, resolve } = Promise.withResolvers();
    const type = `${DONE}:${waitForIt.push(promise)}`;

    // resolve each promise once notified
    addEventListener(type, resolve, { once: true });

    if (element.hasAttribute("worker")) {
        const code = `
            from pyscript import window as _w
            _w.dispatchEvent(_w.Event.new("${type}"))
        `;
        if (isAsync) codeAfterRunWorkerAsync.add(code);
        else codeAfterRunWorker.add(code);
        return code;
    }

    // dispatch only once the ready element is the same
    const code = (_, el) => {
        if (el === element) dispatchEvent(new Event(type));
    };

    if (isAsync) onAfterRunAsync.add(code);
    else onAfterRun.add(code);
    return code;
};

const selector = [];
for (const [TYPE] of TYPES)
    selector.push(`script[type="${TYPE}"]`, `${TYPE}-script`);

// loop over all known scripts and elements
for (const element of document.querySelectorAll(selector.join(",")))
    codes.push(codeFor(element));

// wait for all the things then cleanup
Promise.all(waitForIt).then(() => {
    // cleanup unnecessary hooks
    for (const code of codes) {
        onAfterRun.delete(code);
        onAfterRunAsync.delete(code);
        codeAfterRunWorker.delete(code);
        codeAfterRunWorkerAsync.delete(code);
    }
    dispatchEvent(new Event(DONE));
});
