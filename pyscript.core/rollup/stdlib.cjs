const {
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} = require("node:fs");

const { spawnSync } = require("node:child_process");

const { join } = require("node:path");

const crawl = (path, json) => {
    for (const file of readdirSync(path)) {
        const full = join(path, file);
        if (/\.py$/.test(file)) {
            if (process.env.NO_MIN) json[file] = readFileSync(full).toString();
            else {
                const {
                    output: [error, result],
                } = spawnSync("pyminify", ['--remove-literal-statements', full]);
                if (error) process.exit(1);
                json[file] = result.toString();
            }
        } else if (statSync(full).isDirectory() && !file.endsWith("_"))
            crawl(full, (json[file] = {}));
    }
};

const json = {};

crawl(join(__dirname, "..", "src", "stdlib"), json);

writeFileSync(
    join(__dirname, "..", "src", "stdlib", "pyscript.js"),
    `// ⚠️ This file is an artifact: DO NOT MODIFY\nexport default ${JSON.stringify(
        json,
        null,
        "  ",
    )};\n`,
);
