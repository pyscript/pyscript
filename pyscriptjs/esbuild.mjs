import { build } from 'esbuild';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { watchFile } from 'fs';
import { cp, lstat, readdir } from 'fs/promises';
import { directoryManifest } from './directoryManifest.mjs';

const __dirname = dirname(new URL(import.meta.url).pathname);

const production = !process.env.NODE_WATCH || process.env.NODE_ENV === 'production';

const copy_targets = [
    { src: 'public/index.html', dest: 'build' },
    { src: 'src/plugins/python/*', dest: 'build/plugins/python' },
];

if (!production) {
    copy_targets.push({ src: 'build/*', dest: 'examples/build' });
}

/**
 * An esbuild plugin that injects the Pyscript Python package.
 *
 * It uses onResolve to attach our custom namespace to the import and then uses
 * onLoad to inject the file contents.
 */
function bundlePyscriptPythonPlugin() {
    const namespace = 'bundlePyscriptPythonPlugin';
    return {
        name: namespace,
        setup(build) {
            // Resolve the pyscript_package to our custom namespace
            // The path doesn't really matter, but we need a separate namespace
            // or else the file system resolver will raise an error.
            build.onResolve({ filter: /^pyscript_python_package.esbuild_injected.json$/ }, args => {
                return { path: 'dummy', namespace };
            });
            // Inject our manifest as JSON contents, and use the JSON loader.
            // Also tell esbuild to watch the files & directories we've listed
            // for updates.
            build.onLoad({ filter: /^dummy$/, namespace }, async args => {
                const manifest = await directoryManifest('./src/python');
                return {
                    contents: JSON.stringify(manifest),
                    loader: 'json',
                    watchFiles: manifest.files.map(([k, v]) => k),
                    watchDirs: manifest.dirs,
                };
            });
        },
    };
}

const pyScriptConfig = {
    entryPoints: ['src/main.ts'],
    loader: { '.py': 'text' },
    bundle: true,
    format: 'iife',
    globalName: 'pyscript',
    plugins: [bundlePyscriptPythonPlugin()],
};

const interpreterWorkerConfig = {
    entryPoints: ['src/interpreter_worker/worker.ts'],
    loader: { '.py': 'text' },
    bundle: true,
    format: 'iife',
    plugins: [bundlePyscriptPythonPlugin()],
};

const copyPath = (source, dest, ...rest) => cp(join(__dirname, source), join(__dirname, dest), ...rest);

const esbuild = async () => {
    const timer = `\x1b[1mpyscript\x1b[0m \x1b[2m(${production ? 'prod' : 'dev'})\x1b[0m built in`;
    console.time(timer);

    await Promise.all([
        build({
            ...pyScriptConfig,
            sourcemap: true,
            minify: false,
            outfile: 'build/pyscript.js',
        }),
        build({
            ...pyScriptConfig,
            sourcemap: true,
            minify: true,
            outfile: 'build/pyscript.min.js',
        }),
        // XXX I suppose we should also build a minified version
        // TODO (HC): Simplify config a bit
        build({
            ...interpreterWorkerConfig,
            sourcemap: false,
            minify: false,
            outfile: 'build/interpreter_worker.js',
        }),
    ]);

    const copy = [];
    for (const { src, dest } of copy_targets) {
        if (src.endsWith('/*')) {
            copy.push(copyPath(src.slice(0, -2), dest, { recursive: true }));
        } else {
            copy.push(copyPath(src, dest + src.slice(src.lastIndexOf('/'))));
        }
    }
    await Promise.all(copy);

    console.timeEnd(timer);
};

esbuild().then(() => {
    if (!production) {
        (async function watchPath(path) {
            for (const file of await readdir(path)) {
                const whole = join(path, file);
                if (/\.(js|ts|css|py)$/.test(file)) {
                    watchFile(whole, async () => {
                        await esbuild();
                    });
                } else if ((await lstat(whole)).isDirectory()) {
                    watchPath(whole);
                }
            }
        })('src');

        const server = spawn('python', ['-m', 'http.server', '--directory', './examples', '8080'], {
            stdio: 'inherit',
            detached: false,
        });

        process.on('exit', () => {
            server.kill();
        });
    }
});
