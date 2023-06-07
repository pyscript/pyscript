
const { join, resolve } = require("node:path");
const { readFileSync, writeFileSync } = require("node:fs");

const COINCIDENT_JS = resolve(join(__dirname, "..", "node_modules", "coincident", "esm", "index.js"));

writeFileSync(
  COINCIDENT_JS,
    // find //:RUNTIMES comment and replace anything after that
    readFileSync(COINCIDENT_JS)
        .toString()
        .replace(
          /\s*=>\s*\(\s*\.\.\.args\s*\)\s*=>\s*\{[^\n]*?\n/,
          `=> (...args) => {/* wasmoon shenanigan */if (action === 'then' && args.every(f => typeof f === 'function')) return;\n`
        ),
);
