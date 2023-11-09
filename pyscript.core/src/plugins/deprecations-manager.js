// PyScript Derepcations Plugin
import { hooks } from "../core.js";
import { notify } from "./error.js";

// eslint-disable-next-line no-unused-vars
hooks.main.onReady.add(function checkDeprecations(pyScript) {
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) checkLoadingScriptsFromLatest(script.src);
});
// eslint-disable-next-line no-unused-vars

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
