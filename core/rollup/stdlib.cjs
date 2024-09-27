const {
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} = require("node:fs");

const { spawnSync } = require("node:child_process");

const { join } = require("node:path");

const dedent = require("codedent");

const crawl = (path, json) => {
    for (const file of readdirSync(path)) {
        const full = join(path, file);
        if (/\.py$/.test(file)) {
            if (process.env.NO_MIN) json[file] = readFileSync(full).toString();
            else {
                try {
                    const {
                        output: [error, result],
                    } = spawnSync("pyminify", [
                        "--remove-literal-statements",
                        full,
                    ]);
                    if (error) {
                        console.error(error);
                        process.exit(1);
                    }
                    json[file] = result.toString();
                } catch (error) {
                    console.error(error);
                    console.log(
                        dedent(`
                            \x1b[1m⚠️  is your env activated?\x1b[0m
                            \x1b[2mYou need a Python env to run \x1b[0mpyminify\x1b[2m.\x1b[0m
                            \x1b[2mTo do so, you can try the following:\x1b[0m
                            python -m venv env
                            source env/bin/activate
                            pip install --upgrade pip
                            pip install --ignore-requires-python python-minifier
                            pip install setuptools
                            \x1b[2mand you can then try \x1b[0mnpm run build\x1b[2m again.\x1b[0m
                        `),
                    );
                    process.exit(1);
                }
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
