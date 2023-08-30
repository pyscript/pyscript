export default {
    sleep(seconds) {
        return new Promise(($) => setTimeout($, seconds * 1000));
    },
};
