import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import legacy from '@rollup/plugin-legacy';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import serve from 'rollup-plugin-serve';
import { string } from 'rollup-plugin-string';
import copy from 'rollup-plugin-copy';

const production = !process.env.ROLLUP_WATCH || process.env.NODE_ENV === 'production';

const copy_targets = {
    targets: [
        { src: 'public/index.html', dest: 'build' },
        { src: 'src/plugins/*', dest: 'build/plugins' },
    ],
};

if (!production) {
    copy_targets.targets.push({ src: 'build/*', dest: 'examples/build' });
}

export default {
    input: 'src/main.ts',
    output: [
        {
            file: 'build/pyscript.js',
            format: 'iife',
            sourcemap: true,
            inlineDynamicImports: true,
            name: 'pyscript',
        },
        {
            file: 'build/pyscript.min.js',
            format: 'iife',
            sourcemap: true,
            inlineDynamicImports: true,
            name: 'pyscript',
            plugins: [terser()],
        },
    ],
    plugins: [
        css({ output: 'pyscript.css' }),
        // Bundle all the Python files into the output file
        string({
            include: './src/**/*.py',
        }),
        legacy({ 'src/toml.js': 'toml' }),
        resolve({
            browser: true,
        }),
        commonjs(),
        typescript({
            sourceMap: !production,
            inlineSources: !production,
        }),
        // This will make sure that examples will always get the latest build folder
        copy(copy_targets),
        // production && terser(),
        !production &&
            serve({
                port: 8080,
                contentBase: 'examples',
            }),
    ],
    watch: {
        clearScreen: false,
    },
};
