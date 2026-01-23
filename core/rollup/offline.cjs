const { readFileSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");

const versions = resolve(
    __dirname,
    "..",
    "node_modules",
    "polyscript",
    "versions",
);
let pyodide = String(readFileSync(join(versions, "pyodide"), "utf8")).trim();
let micropython = String(
    readFileSync(join(versions, "micropython"), "utf8"),
).trim();

writeFileSync(
    join(process.cwd(), "offline.html"),
    `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PyScript Offline</title>
        <script src="./mini-coi-fd.js"></script>
        <script type="module" src="./pyscript/core.js" offline></script>
        <link rel="stylesheet" href="./pyscript/core.css">
    </head>
    <body>
        <script type="mpy">
            from pyscript import document

            document.body.append("MicroPython Offline", document.createElement("hr"))
        </script>
        <script type="py" worker>
            from pyscript import document

            document.body.append("Pyodide Offline")
        </script>
    </body>
</html>
`,
    "utf8",
);

let bash = `#!/usr/bin/env bash
rm -rf dist/offline

mkdir -p dist/offline/node_modules
echo '{"dependencies":{"pyodide":"${pyodide}","@micropython/micropython-webassembly-pyscript":"${micropython}"}}' > dist/offline/package.json
cd dist/offline
curl -sLO https://raw.githubusercontent.com/WebReflection/mini-coi/refs/heads/main/mini-coi-fd.js
npm i
cd -

mkdir -p dist/offline/pyscript/pyodide
cd dist/offline/pyscript/pyodide
cp ../../node_modules/pyodide/pyodide* ./
cp ../../node_modules/pyodide/python_stdlib.zip ./
cd -

mkdir -p dist/offline/pyscript/micropython
cd dist/offline/pyscript/micropython
cp ../../node_modules/@micropython/micropython-webassembly-pyscript/micropython.* ./
cd -

rm -rf dist/offline/node_modules
rm -rf dist/offline/*.json

mv offline.html dist/offline/index.html
cp dist/*.* dist/offline/pyscript/
rm -f dist/offline/pyscript/offline.zip

cd dist
zip -r offline.zip offline
rm -rf offline
cd -
`;

console.log(bash);
