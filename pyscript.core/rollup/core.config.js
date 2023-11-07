// This file generates /core.js minified version of the module, which is
// the default exported as npm entry.

import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

const plugins = [];

export default [
    {
        input: "./src/core.js",
        plugins: plugins.concat(
            process.env.NO_MIN
                ? [nodeResolve(), commonjs()]
                : [nodeResolve(), commonjs(), terser()],
        ),
        output: {
            esModule: true,
            dir: "./dist",
            sourcemap: true,
        },
    },
    {
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
            file: "./dist/core.css",
        },
        onwarn(warning, warn) {
            if (warning.code === "FILE_NAME_CONFLICT") return;
            warn(warning);
        },
    },
];
