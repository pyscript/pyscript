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

writeFileShim(FS, "./test/abc.js", []);
assert(JSON.stringify(FS.mkdir_args), `["${__dirname}/test"]`);
assert(
    JSON.stringify(FS.writeFile_args),
    `["${__dirname}/test/abc.js",{},{"canOwn":true}]`,
);

writeFileShim(FS, "/./../abc.js", []);
assert(JSON.stringify(FS.mkdir_args), `["${__dirname}"]`);
assert(
    JSON.stringify(FS.writeFile_args),
    `["${__dirname}/abc.js",{},{"canOwn":true}]`,
);
