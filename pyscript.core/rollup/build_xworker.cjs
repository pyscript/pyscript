// ⚠️ This files creates esm/worker/xworker.js in a way that it can be loaded
//    through a Blob and as a string, allowing Workers to run within any page.
//    This still needs special CSP care when CSP rules are applied to the page
//    and this file is also creating a unique sha256 version of that very same
//    text content to allow CSP rules to play nicely with it.

const { join, resolve } = require("node:path");
const { readdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { createHash } = require("node:crypto");

const WORKERS_DIR = resolve(join(__dirname, "..", "esm", "worker"));
const PACKAGE_JSON = resolve(join(__dirname, "..", "package.json"));

for (const file of readdirSync(WORKERS_DIR)) {
    if (file.startsWith("__")) {
        const js = JSON.stringify(
            readFileSync(join(WORKERS_DIR, file)).toString(),
        );
        const hash = createHash("sha256");
        hash.update(js);
        const json = require(PACKAGE_JSON);
        json.worker = { blob: "sha256-" + hash.digest("base64") };
        writeFileSync(PACKAGE_JSON, JSON.stringify(json, null, "    ") + "\n");
        writeFileSync(
            join(WORKERS_DIR, "xworker.js"),
            `/* c8 ignore next */\nexport default () => new Worker(URL.createObjectURL(new Blob([${js}],{type:'application/javascript'})),{type:'module'});`,
        );
        rmSync(join(WORKERS_DIR, file));
    }
}
