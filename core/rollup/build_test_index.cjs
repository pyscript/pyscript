const { join } = require("node:path");
const { lstatSync, readdirSync, writeFileSync } = require("node:fs");

// folders to not consider while crawling
const EXCLUDE_DIR = new Set(["ws"]);

const TEST_DIR = join(__dirname, "..", "tests");

const TEST_INDEX = join(TEST_DIR, "index.html");

const crawl = (path, tree = {}) => {
    for (const file of readdirSync(path)) {
        const current = join(path, file);
        if (current === TEST_INDEX) continue;
        if (lstatSync(current).isDirectory()) {
            if (EXCLUDE_DIR.has(file)) continue;
            const sub = {};
            tree[file] = sub;
            crawl(current, sub);
            if (!Reflect.ownKeys(sub).length) {
                delete tree[file];
            }
        } else if (file.endsWith(".html")) {
            const name = file === "index.html" ? "." : file.slice(0, -5);
            tree[name] = current.replace(TEST_DIR, "");
        }
    }
    return tree;
};

const createList = (tree) => {
    const ul = ["<ul>"];
    for (const [key, value] of Object.entries(tree)) {
        ul.push("<li>");
        if (typeof value === "string") {
            ul.push(`<a href=".${value}">${key}<small>.html</small></a>`);
        } else {
            if ("." in value) {
                ul.push(`<strong><a href=".${value["."]}">${key}</a></strong>`);
                delete value["."];
            } else {
                ul.push(`<strong><span>${key}</span></strong>`);
            }
            if (Reflect.ownKeys(value).length) ul.push(createList(value));
        }
        ul.push("</li>");
    }
    ul.push("</ul>");
    return ul.join("");
};

writeFileSync(
    TEST_INDEX,
    `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PyScript tests</title>
        <style>
            body { font-family: sans-serif; }
            a {
                display: block;
                transition: opacity .3s;
            }
            a, span { opacity: .7; }
            a:hover { opacity: 1; }
        </style>
    </head>
    <body>${createList(crawl(TEST_DIR))}</body>
</html>
`,
);
