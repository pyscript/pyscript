/**
 * Create through Python the pyscript module through
 * the artifact generated at build time.
 * This the returned value is a string that must be used
 * either before a worker execute code or when the module
 * is registered on the main thread.
 */

import pyscript from "./stdlib/pyscript.js";

const { entries } = Object;

const python = ["from pathlib import Path as _Path"];

const write = (base, literal) => {
    for (const [key, value] of entries(literal)) {
        const path = `_Path("${base}/${key}")`;
        if (typeof value === "string") {
            const code = JSON.stringify(value);
            python.push(`${path}.write_text(${code})`);
        } else {
            python.push(`${path}.mkdir(parents=True, exist_ok=True)`);
            write(`${base}/${key}`, value);
        }
    }
};

write(".", pyscript);

python.push("del _Path");
python.push("\n");

export default python.join("\n");
