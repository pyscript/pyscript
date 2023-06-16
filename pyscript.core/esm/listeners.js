import { $x } from "basic-devtools";

import { interpreters } from "./script-handler.js";
import { all, create, defineProperty } from "./utils.js";
import { registry, prefixes } from "./interpreters.js";

// TODO: this is ugly; need to find a better way
defineProperty(globalThis, "pyscript", {
    value: {
        env: new Proxy(create(null), {
            get: (_, name) => awaitInterpreter(name),
        }),
    },
});

/* c8 ignore start */ // attributes are tested via integration / e2e
// ensure both interpreter and its queue are awaited then returns the interpreter
const awaitInterpreter = async (key) => {
    if (interpreters.has(key)) {
        const { interpreter, queue } = interpreters.get(key);
        return (await all([interpreter, queue]))[0];
    }

    const available = interpreters.size
        ? `Available interpreters are: ${[...interpreters.keys()]
              .map((r) => `"${r}"`)
              .join(", ")}.`
        : `There are no interpreters in this page.`;

    throw new Error(`The interpreter "${key}" was not found. ${available}`);
};

export const listener = async (event) => {
    const { type, currentTarget } = event;
    for (let { name, value, ownerElement: el } of $x(
        `./@*[${prefixes.map((p) => `name()="${p}${type}"`).join(" or ")}]`,
        currentTarget,
    )) {
        name = name.slice(0, -(type.length + 1));
        const interpreter = await awaitInterpreter(
            el.getAttribute(`${name}-env`) || name,
        );
        const handler = registry.get(name);
        try {
            handler.setGlobal(interpreter, "event", event);
            handler.run(interpreter, value);
        } finally {
            handler.deleteGlobal(interpreter, "event");
        }
    }
};

/**
 * Look for known prefixes and add related listeners.
 * @param {Document | Element} root
 */
export const addAllListeners = (root) => {
    for (let { name, ownerElement: el } of $x(
        `.//@*[${prefixes
            .map((p) => `starts-with(name(),"${p}")`)
            .join(" or ")}]`,
        root,
    )) {
        name = name.slice(name.lastIndexOf("-") + 1);
        if (name !== "env") el.addEventListener(name, listener);
    }
};
/* c8 ignore stop */
