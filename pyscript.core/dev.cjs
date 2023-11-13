let queue = Promise.resolve();

const { exec } = require("node:child_process");

const build = (fileName) => {
    if (fileName) console.log(fileName, "changed");
    else console.log("building without optimizations");
    queue = queue.then(
        () =>
            new Promise((resolve) => {
                exec(
                    "npm run build:stdlib && npm run build:plugins && npm run build:core",
                    { cwd: __dirname, env: { ...process.env, NO_MIN: true } },
                    (error) => {
                        if (error) console.error(error);
                        else console.log(fileName || "", "build completed");
                        resolve();
                    },
                );
            }),
    );
};

const options = {
    ignored: /\/(?:toml|plugins|pyscript)\.[mc]?js$/,
    persistent: true,
};

require("chokidar").watch("./src", options).on("change", build);

build();
