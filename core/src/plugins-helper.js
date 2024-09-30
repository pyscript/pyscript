import { defineProperty } from "polyscript/exports";

// helper for all script[type="py"] out there
const before = (script) => {
    defineProperty(document, "currentScript", {
        configurable: true,
        get: () => script,
    });
};

const after = () => {
    delete document.currentScript;
};

// common life-cycle handlers for any node
export default async (main, wrap, element, hook) => {
    const isAsync = hook.endsWith("Async");
    const isBefore = hook.startsWith("onBefore");
    // make it possible to reach the current target node via Python
    // or clean up for other scripts executing around this one
    (isBefore ? before : after)(element);
    for (const fn of main(hook)) {
        if (isAsync) await fn(wrap, element);
        else fn(wrap, element);
    }
};
