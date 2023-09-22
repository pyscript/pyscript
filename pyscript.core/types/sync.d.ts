declare namespace _default {
    /**
     * 'Sleep' for the given number of seconds. Used to implement Python's time.sleep in Worker threads.
     * @param {number} seconds The number of seconds to sleep.
     * @returns {undefined}
     */
    function sleep(seconds: number): undefined;
}
export default _default;
