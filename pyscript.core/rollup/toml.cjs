const { copyFileSync } = require("node:fs");
const { join } = require("node:path");

copyFileSync(
    join(
        __dirname,
        "..",
        "node_modules",
        "@webreflection",
        "toml-j0.4",
        "toml.js",
    ),
    join(__dirname, "..", "src", "toml.js"),
);
