const { readdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const plugins = [""];

for (const file of readdirSync(join(__dirname, "..", "src", "plugins"))) {
    if (/\.js$/.test(file)) {
        const name = file.slice(0, -3);
        const key = /^[a-zA-Z0-9$_]+$/.test(name)
            ? name
            : `[${JSON.stringify(name)}]`;
        const value = JSON.stringify(`./plugins/${file}`);
        plugins.push(`    ${key}: () => import(${value}),`);
    }
}

plugins.push("");

writeFileSync(
    join(__dirname, "..", "src", "plugins.js"),
    `// ⚠️ This file is an artifact: DO NOT MODIFY\nexport default {${plugins.join(
        "\n",
    )}};\n`,
);
