const assert = (current, expected, message = "Unexpected Error") => {
    if (!Object.is(current, expected)) {
        console.error(`\x1b[1m${message}\x1b[0m`);
        console.error("  expected", expected);
        console.error("  got", current);
        process.exit(1);
    }
};

module.exports = assert;
