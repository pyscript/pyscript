const { writeFileShim } = require("../cjs/interpreter/_utils.js");

const assert = require("./assert.js");

const FS = {
    mkdir(...args) {
        this.mkdir_args = args;
    },
    cwd: () => __dirname,
    writeFile(...args) {
        this.writeFile_args = args;
    },
};

// REQUIRE INTEGRATION TESTS
writeFileShim(FS, "./test/abc.js", []);
writeFileShim(FS, "/./../abc.js", []);
