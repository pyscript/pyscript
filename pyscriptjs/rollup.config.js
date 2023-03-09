import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy';
import * as fs from 'fs';
import * as path from 'path';

function directoryManifest(root, dir = '.', result = { dirs: [], files: [] }) {
    const curdir = path.join(root, dir);
    const dirObj = fs.opendirSync(curdir);
    try {
        let d;
        while ((d = dirObj.readSync())) {
            const entry = path.join(dir, d.name);
            if (d.isDirectory()) {
                if (d.name === '__pycache__') {
                    continue;
                }
                result.dirs.push(entry);
                directoryManifest(root, entry, result);
            } else if (d.isFile()) {
                result.files.push([entry, fs.readFileSync(path.join(root, entry), { encoding: 'utf-8' })]);
            }
        }
        return result;
    } finally {
        dirObj.close();
    }
}

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
    output: [{ minify: true }, { minify: false }].map(({ minify }) => ({
        file: `build/pyscript${minify ? '.min' : ''}.js`,
        format: 'iife',
        sourcemap: !production,
        inlineDynamicImports: true,
        name: 'pyscript',
        plugins: [
            terser({
                compress: {
                    defaults: minify,
                    dead_code: true,
                    global_defs: {
                        pyscript_package: directoryManifest('./src/python'),
                    },
                },
                mangle: minify,
                format: {
                    beautify: !minify,
                },
            }),
        ],
    })),
    plugins: [
        css({ output: 'pyscript.css' }),
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
