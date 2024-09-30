const { writeFileSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const flatted = "# https://www.npmjs.com/package/flatted\n\n";
const source = join(
    __dirname,
    "..",
    "node_modules",
    "flatted",
    "python",
    "flatted.py",
);
const dest = join(__dirname, "..", "src", "stdlib", "pyscript", "flatted.py");

const clear = (str) => String(str).replace(/^#.*/gm, "").trimStart();

writeFileSync(dest, flatted + clear(readFileSync(source)));
