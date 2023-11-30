const { copyFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const CDN = "https://cdn.jsdelivr.net/npm";

const targets = join(__dirname, "..", "src", "3rd-party");
const node_modules = join(__dirname, "..", "node_modules");

const { devDependencies } = require(join(__dirname, "..", "package.json"));

const v = (name) => devDependencies[name].replace(/[^\d.]/g, "");

const dropSourceMap = (str) =>
    str.replace(/^\/.+? sourceMappingURL=\/.+$/m, "");

// Fetch a module via jsdelivr CDN `/+esm` orchestration
// then sanitize the resulting outcome to avoid importing
// anything via `/npm/...` through Rollup
const resolve = (name) => {
    const cdn = `${CDN}/${name}@${v(name)}/+esm`;
    console.debug("fetching", cdn);
    return fetch(cdn)
        .then((b) => b.text())
        .then((text) =>
            text.replace(
                /("|')\/npm\/(.+)?\+esm\1/g,
                // normalize `/npm/module@version/+esm` as
                // just `module` so that rollup can do the rest
                (_, quote, module) => {
                    const i = module.lastIndexOf("@");
                    return `${quote}${module.slice(0, i)}${quote}`;
                },
            ),
        );
};

// create a file rollup can then process and understand
const reBundle = (name) => Promise.resolve(`export * from "${name}";\n`);

// key/value pairs as:
//  "3rd-party/file-name.js"
//    string as content or
//    Promise<string> as resolved content
const modules = {
    // toml
    "toml.js": join(node_modules, "@webreflection", "toml-j0.4", "toml.js"),

    // xterm
    "xterm.js": resolve("xterm"),
    "xterm-readline.js": resolve("xterm-readline"),
    "xterm_addon-fit.js": fetch(`${CDN}/@xterm/addon-fit/+esm`).then((b) =>
        b.text(),
    ),
    "xterm.css": fetch(`${CDN}/xterm@${v("xterm")}/css/xterm.min.css`).then(
        (b) => b.text(),
    ),

    // codemirror
    "codemirror.js": reBundle("codemirror"),
    "codemirror_state.js": reBundle("@codemirror/state"),
    "codemirror_lang-python.js": reBundle("@codemirror/lang-python"),
    "codemirror_language.js": reBundle("@codemirror/language"),
    "codemirror_view.js": reBundle("@codemirror/view"),
    "codemirror_commands.js": reBundle("@codemirror/commands"),
};

for (const [target, source] of Object.entries(modules)) {
    if (typeof source === "string") copyFileSync(source, join(targets, target));
    else {
        source.then((text) =>
            writeFileSync(join(targets, target), dropSourceMap(text)),
        );
    }
}
