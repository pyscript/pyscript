import { $x, $$ } from "basic-devtools";

import xworker from "./worker/class.js";
import { handle, runtimes } from "./script-handler.js";
import { all, assign, create, defineProperty } from "./utils.js";
import { registry, selectors, prefixes } from "./runtimes.js";
import { PLUGINS_SELECTORS, handlePlugin } from "./plugins.js";

export { registerPlugin } from "./plugins.js";
export const XWorker = xworker();

const RUNTIME_SELECTOR = selectors.join(",");

// ensure both runtime and its queue are awaited then returns the runtime
const awaitRuntime = async (key) => {
    const { runtime, queue } = runtimes.get(key);
    return (await all([runtime, queue]))[0];
};

defineProperty(globalThis, "pyscript", {
    value: {
        env: new Proxy(create(null), { get: (_, name) => awaitRuntime(name) }),
    },
});

let index = 0;
globalThis.__events = new Map();

// attributes are tested via integration / e2e
/* c8 ignore next 17 */
const listener = async (event) => {
    const { type, currentTarget } = event;
    for (let { name, value, ownerElement: el } of $x(
        `./@*[${prefixes.map((p) => `name()="${p}${type}"`).join(" or ")}]`,
        currentTarget,
    )) {
        name = name.slice(0, -(type.length + 1));
        const runtime = await awaitRuntime(
            el.getAttribute(`${name}-env`) || name,
        );
        const i = index++;
        try {
            globalThis.__events.set(i, event);
            registry.get(name).runEvent(runtime, value, i);
        } finally {
            globalThis.__events.delete(i);
        }
    }
};

// attributes are tested via integration / e2e
/* c8 ignore next 8 */
for (let { name, ownerElement: el } of $x(
    `.//@*[${prefixes.map((p) => `starts-with(name(),"${p}")`).join(" or ")}]`,
)) {
    name = name.slice(name.indexOf("-") + 1);
    if (name !== "env") el.addEventListener(name, listener);
}

const mo = new MutationObserver((records) => {
    for (const { type, target, attributeName, addedNodes } of records) {
        // attributes are tested via integration / e2e
        /* c8 ignore next 17 */
        if (type === "attributes") {
            const i = attributeName.indexOf("-") + 1;
            if (i) {
                const prefix = attributeName.slice(0, i);
                for (const p of prefixes) {
                    if (prefix === p) {
                        const type = attributeName.slice(i);
                        if (type !== "env") {
                            const method = target.hasAttribute(attributeName)
                                ? "add"
                                : "remove";
                            target[`${method}EventListener`](type, listener);
                        }
                        break;
                    }
                }
            }
            continue;
        }
        for (const node of addedNodes) {
            if (node.nodeType === 1) {
                if (node.matches(RUNTIME_SELECTOR)) handle(node);
                else {
                    $$(RUNTIME_SELECTOR, node).forEach(handle);
                    if (!PLUGINS_SELECTORS.length) continue;
                    handlePlugin(node);
                    $$(PLUGINS_SELECTORS.join(","), node).forEach(handlePlugin);
                }
            }
        }
    }
});

const observe = (root) => {
    mo.observe(root, { childList: true, subtree: true, attributes: true });
    return root;
};

const { attachShadow } = Element.prototype;
assign(Element.prototype, {
    attachShadow(init) {
        return observe(attachShadow.call(this, init));
    },
});

$$(RUNTIME_SELECTOR, observe(document)).forEach(handle);
