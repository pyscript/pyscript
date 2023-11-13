// PyScript Error Plugin
import { hooks } from "../core.js";

hooks.main.onReady.add(function override(pyScript) {
    // be sure this override happens only once
    hooks.main.onReady.delete(override);

    // trap generic `stderr` to propagate to it regardless
    const { stderr } = pyScript.io;

    // override it with our own logic
    pyScript.io.stderr = (error, ...rest) => {
        notify(error.message || error);
        // let other plugins or stderr hook, if any, do the rest
        return stderr(error, ...rest);
    };

    // be sure uncaught Python errors are also visible
    addEventListener("error", ({ message }) => {
        if (message.startsWith("Uncaught PythonError")) notify(message);
    });
});

// Error hook utilities

// Custom function to show notifications

/**
 * Add a banner to the top of the page, notifying the user of an error
 * @param {string} message
 */
export function notify(message) {
    const div = document.createElement("div");
    div.className = "py-error";
    div.textContent = message;
    div.style.cssText = `
    border: 1px solid red;
    background: #ffdddd;
    color: black;
    font-family: courier, monospace;
    white-space: pre;
    overflow-x: auto;
    padding: 8px;
    margin-top: 8px;
  `;
    document.body.append(div);
}
