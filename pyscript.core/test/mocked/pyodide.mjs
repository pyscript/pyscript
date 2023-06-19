import { basename, dirname } from "node:path";

let target;
export const setTarget = (value) => {
    target = value;
};
export const python = { content: "", target: null, packages: null };
export const loadPyodide = () => ({
    loadPackage() {},
    pyimport() {
        return {
            install(packages) {
                python.packages = packages;
            },
            destroy() {},
        };
    },
    runPython(content) {
        python.content = content;
        if (target) {
            document.currentScript.target = target;
            target = void 0;
        }
        python.target = document.currentScript.target;
    },
    globals: {
        set(name, value) {
            globalThis[name] = value;
        },
        delete(name) {
            delete globalThis[name];
        },
    },
    FS: {
        mkdirTree() {},
        writeFile() {},
        analyzePath: (path) => ({
            parentPath: dirname(path),
            name: basename(path),
        }),
    },
    _module: {
        PATH: { dirname },
        PATH_FS: {
            resolve: (path) => path,
        },
    },
});
