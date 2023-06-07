import { getBuffer } from "../fetch-utils.js";
import { absoluteURL, defineProperty } from "../utils.js";
import "@ungap/with-resolvers";

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
// TODO: this should *NOT* be needed as the polyfill
//       already patches on demand the Promise object
const { withResolvers } = Promise;
defineProperty(globalThis, "Promise", {
    configurable: true,
    value: class extends Promise {
        withResolvers() {
            return withResolvers.call(this);
        }
    },
});
/* c8 ignore stop */

/**
 * Trim code only if it's a single line that prettier or other tools might have modified.
 * @param {string} code code that might be a single line
 * @returns {string}
 */
export const clean = (code) =>
    code.replace(/^[^\r\n]+$/, (line) => line.trim());

// REQUIRES INTEGRATION TEST
/* c8 ignore start */
export const io = new WeakMap();
export const stdio = (init) => {
    const context = init || console;
    const localIO = {
        stderr: (context.stderr || console.error).bind(context),
        stdout: (context.stdout || console.log).bind(context),
    };
    return {
        stderr: (...args) => localIO.stderr(...args),
        stdout: (...args) => localIO.stdout(...args),
        async get(engine) {
            const runtime = await engine;
            io.set(runtime, localIO);
            return runtime;
        },
    };
};
/* c8 ignore stop */

// This should be the only helper needed for all Emscripten based FS exports
export const writeFile = (FS, path, buffer) => {
    const { parentPath, name } = FS.analyzePath(path, true);
    FS.mkdirTree(parentPath);
    return FS.writeFile([parentPath, name].join("/"), new Uint8Array(buffer), {
        canOwn: true,
    });
};

// This is instead a fallback for Lua or others
export const writeFileShim = (FS, path, buffer) => {
    path = resolve(FS, path);
    mkdirTree(FS, dirname(path));
    return FS.writeFile(path, new Uint8Array(buffer), { canOwn: true });
};

const dirname = (path) => {
    const tree = path.split("/");
    tree.pop();
    return tree.join("/");
};

const mkdirTree = (FS, path) => {
    const current = [];
    for (const branch of path.split("/")) {
        current.push(branch);
        if (branch) FS.mkdir(current.join("/"));
    }
};

const resolve = (FS, path) => {
    const tree = [];
    for (const branch of path.split("/")) {
        switch (branch) {
            case "":
                break;
            case ".":
                break;
            case "..":
                tree.pop();
                break;
            default:
                tree.push(branch);
        }
    }
    return [FS.cwd()].concat(tree).join("/").replace(/^\/+/, "/");
};

import { all, isArray } from "../utils.js";

const calculateFetchPaths = (config_fetch) => {
    // REQUIRES INTEGRATION TEST
    /* c8 ignore start */
    for (const { files, to_file, from = "" } of config_fetch) {
        if (files !== undefined && to_file !== undefined)
            throw new Error(
                `Cannot use 'to_file' and 'files' parameters together!`,
            );
        if (files === undefined && to_file === undefined && from.endsWith("/"))
            throw new Error(
                `Couldn't determine the filename from the path ${from}, please supply 'to_file' parameter.`,
            );
    }
    /* c8 ignore stop */
    return config_fetch.flatMap(
        ({ from = "", to_folder = ".", to_file, files }) => {
            if (isArray(files))
                return files.map((file) => ({
                    url: joinPaths([from, file]),
                    path: joinPaths([to_folder, file]),
                }));
            const filename = to_file || from.slice(1 + from.lastIndexOf("/"));
            return [{ url: from, path: joinPaths([to_folder, filename]) }];
        },
    );
};

const joinPaths = (parts) => {
    const res = parts
        .map((part) => part.trim().replace(/(^[/]*|[/]*$)/g, ""))
        .filter((p) => p !== "" && p !== ".")
        .join("/");

    return parts[0].startsWith("/") ? `/${res}` : res;
};

const fetchResolved = (config_fetch, url) =>
    fetch(absoluteURL(url, base.get(config_fetch)));

export const base = new WeakMap();

export const fetchPaths = (module, runtime, config_fetch) =>
    all(
        calculateFetchPaths(config_fetch).map(({ url, path }) =>
            fetchResolved(config_fetch, url)
                .then(getBuffer)
                .then((buffer) => module.writeFile(runtime, path, buffer)),
        ),
    );
