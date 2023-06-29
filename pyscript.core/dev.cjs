let queue = Promise.resolve();

const { exec } = require("node:child_process");

const build = (fileName) => {
    if (fileName) console.log(fileName, "changed");
    else console.log("building without optimizations");
    queue = queue.then(
        () =>
            new Promise((resolve, reject) => {
                exec(
                    "npm run rollup:xworker && npm run rollup:core && npm run rollup:pyscript",
                    { cwd: __dirname, env: { ...process.env, NO_MIN: true } },
                    (error) => {
                        if (error) reject(error);
                        else
                            resolve(
                                console.log(fileName || "", "build completed"),
                            );
                    },
                );
            }),
    );
};

const options = {
    ignored: /\/(?:__template|interpreters|xworker)\.[mc]?js$/,
    persistent: true,
};

require("chokidar").watch("./esm", options).on("change", build);

build();
