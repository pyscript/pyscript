import postcss from "rollup-plugin-postcss";

export default {
    input: "./src/core.css",
    plugins: [
        postcss({
            extract: true,
            sourceMap: false,
            minimize: !process.env.NO_MIN,
            plugins: [],
        }),
    ],
    output: {
        file: "./core.css",
    },
    onwarn(warning, warn) {
        if (warning.code === "FILE_NAME_CONFLICT") return;
        warn(warning);
    },
};
