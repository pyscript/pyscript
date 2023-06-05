// ⚠️ This files modifies at build time esm/runtimes.js so that
//    it's impossible to forget to export a runtime from esm/runtime folder.

const { join, resolve } = require("node:path");
const { readdirSync, readFileSync, writeFileSync } = require("node:fs");

const RUNTIMES_DIR = resolve(join(__dirname, "..", "esm", "runtime"));
const RUNTIMES_JS = resolve(join(__dirname, "..", "esm", "runtimes.js"));

const createRuntimes = () => {
    const runtimes = [];
    for (const file of readdirSync(RUNTIMES_DIR)) {
        // ignore files starting with underscore
        if (/^[a-z].+?\.js/.test(file)) runtimes.push(file.slice(0, -3));
    }
    // generate the output to append at the end of the file
    const output = [];
    for (const runtime of runtimes)
        output.push(`import ${runtime} from './runtime/${runtime}.js';`);
    output.push(
        `for (const runtime of [${runtimes.join(", ")}]) register(runtime);`,
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
