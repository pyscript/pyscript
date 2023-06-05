import { $ } from "basic-devtools";

import xworker from "./worker/class.js";
import { getRuntime, getRuntimeID } from "./loader.js";
import { registry } from "./runtimes.js";
import { all, resolve, defineProperty, absoluteURL } from "./utils.js";
import { getText } from "./fetch-utils.js";

const getRoot = (script) => {
    let parent = script;
    while (parent.parentNode) parent = parent.parentNode;
    return parent;
};

const queryTarget = (script, idOrSelector) => {
    const root = getRoot(script);
    return root.getElementById(idOrSelector) || $(idOrSelector, root);
};

const targets = new WeakMap();
const targetDescriptor = {
    get() {
        let target = targets.get(this);
        if (!target) {
            target = document.createElement(`${this.type}-script`);
            targets.set(this, target);
            handle(this);
        }
        return target;
    },
    set(target) {
        if (typeof target === "string")
            targets.set(this, queryTarget(this, target));
        else {
            targets.set(this, target);
            handle(this);
        }
    },
};

const handled = new WeakMap();

export const runtimes = new Map();

const execute = async (script, source, XWorker, isAsync) => {
    const module = registry.get(script.type);
    /* c8 ignore next */
    if (module.experimental)
        console.warn(`The ${script.type} runtime is experimental`);
    const [runtime, content] = await all([handled.get(script).runtime, source]);
    try {
        // temporarily override inherited document.currentScript in a non writable way
        // but it deletes it right after to preserve native behavior (as it's sync: no trouble)
        defineProperty(globalThis, "XWorker", {
            configurable: true,
            get: () => XWorker,
        });
        defineProperty(document, "currentScript", {
            configurable: true,
            get: () => script,
        });
        return module[isAsync ? "runAsync" : "run"](runtime, content);
    } finally {
        delete globalThis.XWorker;
        delete document.currentScript;
    }
};

const getValue = (ref, prefix) => {
    const value = ref?.value;
    return value ? prefix + value : "";
};

export const getDetails = (type, id, name, version, config) => {
    if (!runtimes.has(id)) {
        const details = {
            runtime: getRuntime(name, config),
            queue: resolve(),
            XWorker: xworker(type, version),
        };
        runtimes.set(id, details);
        // enable sane defaults when single runtime *of kind* is used in the page
        // this allows `xxx-*` attributes to refer to such runtime without `env` around
        if (!runtimes.has(type)) runtimes.set(type, details);
    }
    return runtimes.get(id);
};

/**
 * @param {HTMLScriptElement} script a special type of <script>
 */
export const handle = async (script) => {
    // known node, move its companion target after
    // vDOM or other use cases where the script is a tracked element
    if (handled.has(script)) {
        const { target } = script;
        if (target) {
            // if the script is in the head just append target to the body
            if (script.closest("head")) document.body.append(target);
            // in any other case preserve the script position
            else script.after(target);
        }
    }
    // new script to handle ... allow newly created scripts to work
    // just exactly like any other script would
    else {
        // allow a shared config among scripts, beside runtime,
        // and/or source code with different config or runtime
        const {
            attributes: { async: isAsync, config, env, target, version },
            src,
            type,
        } = script;
        const versionValue = version?.value;
        const name = getRuntimeID(type, versionValue);
        const targetValue = getValue(target, "");
        let configValue = getValue(config, "|");
        const id = getValue(env, "") || `${name}${configValue}`;
        configValue = configValue.slice(1);
        if (configValue) configValue = absoluteURL(configValue);
        const details = getDetails(type, id, name, versionValue, configValue);

        handled.set(
            defineProperty(script, "target", targetDescriptor),
            details,
        );

        if (targetValue) targets.set(script, queryTarget(script, targetValue));

        // start fetching external resources ASAP
        const source = src ? fetch(src).then(getText) : script.textContent;
        details.queue = details.queue.then(() =>
            execute(script, source, details.XWorker, !!isAsync),
        );
    }
};
