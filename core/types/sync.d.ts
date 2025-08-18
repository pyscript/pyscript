declare namespace _default {
    function is_pyterminal(): boolean;
    /**
     * 'Sleep' for the given number of seconds. Used to implement Python's time.sleep in Worker threads.
     * @param {number} seconds The number of seconds to sleep.
     */
    function sleep(seconds: number): Promise<any>;
    /**
     * Ask a user action via dialog and returns the directory handler once granted.
     * @param {string} uid
     * @param {{id?:string, mode?:"read"|"readwrite", hint?:"desktop"|"documents"|"downloads"|"music"|"pictures"|"videos"}} options
     * @returns {Promise<boolean>}
     */
    function storeFSHandler(uid: string, options?: {
        id?: string;
        mode?: "read" | "readwrite";
        hint?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
    }): Promise<boolean>;
    /**
     * Explicitly remove the unique identifier for the FS handler.
     * @param {string} uid
     * @returns {Promise<boolean>}
     */
    function deleteFSHandler(uid: string): Promise<boolean>;
}
export default _default;
