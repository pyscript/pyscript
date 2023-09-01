const {
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} = require("node:fs");
const { join } = require("node:path");

const crawl = (path, json) => {
    for (const file of readdirSync(path)) {
        const full = join(path, file);
        if (/\.py$/.test(file)) json[file] = readFileSync(full).toString();
        else if (statSync(full).isDirectory() && !file.endsWith("_"))
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
