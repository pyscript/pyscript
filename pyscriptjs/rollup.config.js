import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";
import serve from 'rollup-plugin-serve'

const production = !process.env.ROLLUP_WATCH || (process.env.NODE_ENV === "production");

function serve_() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"],
        {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default {
  input: "src/main.ts",
  output:[
    {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "examples/build/pyscript.js",
    },
    { file: "examples/build/pyscript.min.js", format: "iife", plugins: [terser()] },
  ],
  plugins: [
    svelte({
      // add postcss config with tailwind
      preprocess: sveltePreprocess({
        postcss: {
          plugins: [require("tailwindcss"), require("autoprefixer")],
        },
      }),
      compilerOptions: {
        dev: !production,
      },
    }),
    css({ output: "pyscript.css" }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),
    !production && serve(),
    !production && livereload("public"),
    production && terser(),
    !production && serve({
      port: 8080,
      contentBase: 'examples'}
      )
  ],
  watch: {
    clearScreen: false,
  },
};
