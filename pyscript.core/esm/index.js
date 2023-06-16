import { $$ } from "basic-devtools";

import xworker from "./worker/class.js";
import { handle } from "./script-handler.js";
import { assign } from "./utils.js";
import { selectors, prefixes } from "./interpreters.js";
import { CUSTOM_SELECTORS, handleCustomType } from "./custom-types.js";
import { listener, addAllListeners } from "./listeners.js";

export { define, whenDefined } from "./custom-types.js";
export const XWorker = xworker();

const INTERPRETER_SELECTORS = selectors.join(",");

const mo = new MutationObserver((records) => {
    for (const { type, target, attributeName, addedNodes } of records) {
        // attributes are tested via integration / e2e
        /* c8 ignore next 17 */
        if (type === "attributes") {
            const i = attributeName.lastIndexOf("-") + 1;
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
                addAllListeners(node);
                if (node.matches(INTERPRETER_SELECTORS)) handle(node);
                else {
                    $$(INTERPRETER_SELECTORS, node).forEach(handle);
                    if (!CUSTOM_SELECTORS.length) continue;
                    handleCustomType(node);
                    $$(CUSTOM_SELECTORS.join(","), node).forEach(
                        handleCustomType,
                    );
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

addAllListeners(observe(document));
$$(INTERPRETER_SELECTORS, document).forEach(handle);
