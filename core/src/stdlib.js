/**
 * Create through Python the pyscript module through
 * the artifact generated at build time.
 * This the returned value is a string that must be used
 * either before a worker execute code or when the module
 * is registered on the main thread.
 */

import pyscript from "./stdlib/pyscript.js";

class Ignore extends Array {
    #add = false;
    #paths;
    #array;
    constructor(array, ...paths) {
        super();
        this.#array = array;
        this.#paths = paths;
    }
    push(...values) {
        if (this.#add) super.push(...values);
        return this.#array.push(...values);
    }
    path(path) {
        for (const _path of this.#paths) {
            // bails out at the first `true` value
            if ((this.#add = path.startsWith(_path))) break;
        }
    }
}

const { entries } = Object;

const python = [
    "import os as _os",
    "from pathlib import Path as _Path",
    "_path = None",
];

const ignore = new Ignore(python, "-");

const write = (base, literal) => {
    for (const [key, value] of entries(literal)) {
        ignore.path(`${base}/${key}`);
        ignore.push(`_path = _Path("${base}/${key}")`);
        if (typeof value === "string") {
            const code = JSON.stringify(value);
            ignore.push(`_path.write_text(${code},encoding="utf-8")`);
        } else {
            // @see https://github.com/pyscript/pyscript/pull/1813#issuecomment-1781502909
            ignore.push(`if not _os.path.exists("${base}/${key}"):`);
            ignore.push("    _path.mkdir(parents=True, exist_ok=True)");
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

export const stdlib = python.join("\n");
export const optional = ignore.join("\n");
