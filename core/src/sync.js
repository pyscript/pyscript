import { idb, getFileSystemDirectoryHandle } from "./fs.js";

export default {
    // allow pyterminal checks to bootstrap
    is_pyterminal: () => false,

    /**
     * 'Sleep' for the given number of seconds. Used to implement Python's time.sleep in Worker threads.
     * @param {number} seconds The number of seconds to sleep.
     */
    sleep(seconds) {
        return new Promise(($) => setTimeout($, seconds * 1000));
    },

    /**
     * Ask a user action via dialog and returns the directory handler once granted.
     * @param {string} uid
     * @param {{id?:string, mode?:"read"|"readwrite", hint?:"desktop"|"documents"|"downloads"|"music"|"pictures"|"videos"}} options
     * @returns {Promise<boolean>}
     */
    async storeFSHandler(uid, options = {}) {
        if (await idb.has(uid)) return true;
        return getFileSystemDirectoryHandle(options).then(
            async (handler) => {
                await idb.set(uid, handler);
                return true;
            },
            () => false,
        );
    },

    /**
     * Explicitly remove the unique identifier for the FS handler.
     * @param {string} uid
     * @returns {Promise<boolean>}
     */
    async deleteFSHandler(uid) {
        const had = await idb.has(uid);
        if (had) await idb.delete(uid);
        return had;
    },
};
