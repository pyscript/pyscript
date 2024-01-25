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
};
