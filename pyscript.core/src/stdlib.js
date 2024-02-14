/**
 * Create through Python the pyscript module through
 * the artifact generated at build time.
 * This the returned value is a string that must be used
 * either before a worker execute code or when the module
 * is registered on the main thread.
 */

import pyscript from "./stdlib/pyscript.js";

const { entries } = Object;

const python = [
    "import os as _os",
    "from pathlib import Path as _Path",
    "_path = None",
];

const write = (base, literal) => {
    for (const [key, value] of entries(literal)) {
        python.push(`_path = _Path("${base}/${key}")`);
        if (typeof value === "string") {
            const code = JSON.stringify(value);
            python.push(`_path.write_text(${code},encoding="utf-8")`);
        } else {
            // @see https://github.com/pyscript/pyscript/pull/1813#issuecomment-1781502909
            python.push(`if not _os.path.exists("${base}/${key}"):`);
            python.push("    _path.mkdir(parents=True, exist_ok=True)");
            write(`${base}/${key}`, value);
        }
    }
};

write(".", pyscript);

// in order to fix js.document in the Worker case
// we need to bootstrap pyscript module ASAP
python.push("import pyscript as _pyscript");

python.push(
    ...["_Path", "_path", "_os", "_pyscript"].map((ref) => `del ${ref}`),
);
python.push("\n");

export default python.join("\n");
