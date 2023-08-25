// This file generates /core.js minified version of the module, which is
// the default exported as npm entry.

import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { string } from "rollup-plugin-string";

const plugins = [
    string({
        // Required to be specified
        include: "**/*.py",
    }),
];

export default {
    input: "./src/core.js",
    plugins: plugins.concat(
        process.env.NO_MIN ? [nodeResolve()] : [nodeResolve(), terser()],
    ),
    output: {
        esModule: true,
        file: "./core.js",
        sourcemap: true,
    },
};
