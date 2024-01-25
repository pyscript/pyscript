declare namespace _default {
    function is_pyterminal(): boolean;
    /**
     * 'Sleep' for the given number of seconds. Used to implement Python's time.sleep in Worker threads.
     * @param {number} seconds The number of seconds to sleep.
     */
    function sleep(seconds: number): Promise<any>;
}
export default _default;
