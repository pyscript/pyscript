// PyScript Derepcations Plugin
import { notify } from "./error.js";
import { hooks } from "../core.js";

// react lazily on PyScript bootstrap
hooks.main.onReady.add(checkDeprecations);
hooks.main.onWorker.add(checkDeprecations);

/**
 * Check that there are no scripts loading from pyscript.net/latest
 */
function checkDeprecations() {
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) checkLoadingScriptsFromLatest(script.src);
}

/**
 * Check if src being loaded from pyscript.net/latest and display a notification if true
 * * @param {string} src
 */
function checkLoadingScriptsFromLatest(src) {
    if (/\/pyscript\.net\/latest/.test(src)) {
        notify(
            "Loading scripts from latest is deprecated and will be removed soon. Please use a specific version instead.",
        );
    }
}
