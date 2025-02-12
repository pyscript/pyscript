import IDBMap from '@webreflection/idb-map';
import { assign } from "polyscript/exports";
import { $$ } from "basic-devtools";

const stop = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
};

// ⚠️ these two constants MUST be passed as `fs`
//     within the worker onBeforeRunAsync hook!
export const NAMESPACE = "@pyscript.fs";
export const ERROR = "storage permissions not granted";

export const idb = new IDBMap(NAMESPACE);

/**
 * Ask a user action via dialog and returns the directory handler once granted.
 * @param {{id?:string, mode?:"read"|"readwrite", hint?:"desktop"|"documents"|"downloads"|"music"|"pictures"|"videos"}} options
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export const getFileSystemDirectoryHandle = (options) => {
    const { promise, resolve, reject } = Promise.withResolvers();

    const how = { id: "pyscript", mode: "readwrite", ...options };
    if (options.hint) how.startIn = options.hint;

    const dialog = assign(document.createElement("dialog"), {
        className: "pyscript-fs",
        innerHTML: [
            "<strong>ℹ️ Persistent FileSystem</strong><hr>",
            "<p><small>PyScript would like to access a local folder.</small></p>",
            "<div><button title='ok'>✅ Authorize</button>",
            "<button title='cancel'>❌</button></div>",
        ].join("")
    });

    const [ok, cancel] = $$("button", dialog);

    ok.addEventListener("click", async event => {
        stop(event);
        try {
            /* eslint-disable */
            const handler = await showDirectoryPicker(how);
            /* eslint-enable */
            if (await handler.requestPermission(how) === "granted") {
                resolve(handler);
                dialog.close();
            }
        }
        catch ({ message }) {
            console.warn(message);
        }
    });

    cancel.addEventListener("click", async event => {
      stop(event);
      reject(new Error(ERROR));
      dialog.close();
    });

    document.body.appendChild(dialog).showModal();

    return promise;
};
