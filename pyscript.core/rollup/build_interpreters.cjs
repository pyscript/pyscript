// ⚠️ This files modifies at build time esm/interpreters.js so that
//    it's impossible to forget to export a interpreter from esm/interpreter folder.

const { join, resolve } = require("node:path");
const { readdirSync, readFileSync, writeFileSync } = require("node:fs");

const RUNTIMES_DIR = resolve(join(__dirname, "..", "esm", "interpreter"));
const RUNTIMES_JS = resolve(join(__dirname, "..", "esm", "interpreters.js"));

const createRuntimes = () => {
    const interpreters = [];
    for (const file of readdirSync(RUNTIMES_DIR)) {
        // ignore files starting with underscore
        if (/^[a-z].+?\.js/.test(file)) interpreters.push(file.slice(0, -3));
    }
    // generate the output to append at the end of the file
    const output = [];
    for (let i = 0; i < interpreters.length; i++) {
        const interpreter = interpreters[i].replace(/-/g, "_");
        output.push(
            `import ${interpreter.replace(/-/g, "_")} from "./interpreter/${
                interpreters[i]
            }.js";`,
        );
        interpreters[i] = interpreter;
    }
    output.push(
        `
for (const interpreter of [${interpreters.join(", ")}])
    register(interpreter);
`.trim(),
    );
    return output.join("\n");
};

writeFileSync(
    RUNTIMES_JS,
    // find //:RUNTIMES comment and replace anything after that
    readFileSync(RUNTIMES_JS)
        .toString()
        .replace(/(\/\/:RUNTIMES)([\S\s]*)$/, `$1\n${createRuntimes()}\n`),
);
