const { build } = require('esbuild');
const { spawn } = require('child_process');
const { join } = require('path');
const { watchFile } = require('fs');
const { cp, lstat, readdir, opendir, readFile } = require('fs/promises');

const production = !process.env.NODE_WATCH || process.env.NODE_ENV === 'production';

const copy_targets = [
    { src: 'public/index.html', dest: 'build' },
    { src: 'src/plugins/python/*', dest: 'build/plugins/python' },
];

if (!production) {
    copy_targets.push({ src: 'build/*', dest: 'examples/build' });
}

/**
 * List out everything in a directory, but skip __pycache__ directory. Used to
 * list out the directory paths and the [file path, file contents] pairs in the
 * Python package. All paths are relative to the directory we are listing. The
 * directories are sorted topologically so that a parent directory always
 * appears before its children.
 *
 * This is consumed in main.ts which calls mkdir for each directory and then
 * writeFile to create each file.
 *
 * @param {string} dir The path to the directory we want to list out
 * @returns {dirs: string[], files: [string, string][]}
 */
async function directoryManifest(dir) {
    const result = { dirs: [], files: [] };
    await _directoryManifestHelper(dir, '.', result);
    return result;
}

/**
 * Recursive helper function for directoryManifest
 */
async function _directoryManifestHelper(root, dir, result) {
    const dirObj = await opendir(join(root, dir));
    for await (const d of dirObj) {
        const entry = join(dir, d.name);
        if (d.isDirectory()) {
            if (d.name === '__pycache__') {
                continue;
            }
            result.dirs.push(entry);
            await _directoryManifestHelper(root, entry, result);
        } else if (d.isFile()) {
            result.files.push([entry, await readFile(join(root, entry), { encoding: 'utf-8' })]);
        }
    }
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
