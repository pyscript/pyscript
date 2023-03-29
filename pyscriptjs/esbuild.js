const { build } = require('esbuild');
const { spawn } = require('child_process');
const { join } = require('path');
const { watchFile } = require('fs');
const { cp, lstat, readdir } = require('fs/promises');

const production = !process.env.NODE_WATCH || process.env.NODE_ENV === 'production';

const copy_targets = [
    { src: 'public/index.html', dest: 'build' },
    { src: 'src/plugins/python/*', dest: 'build/plugins/python' },
];

if (!production) {
    copy_targets.push({ src: 'build/*', dest: 'examples/build' });
}

const pyScriptConfig = {
    entryPoints: ['src/main.ts'],
    loader: { '.py': 'text' },
    bundle: true,
    format: 'iife',
    globalName: 'pyscript',
};

const copyPath = (source, dest, ...rest) => cp(join(__dirname, source), join(__dirname, dest), ...rest);

const esbuild = async () => {
    const timer = `\x1b[1mpyscript\x1b[0m \x1b[2m(${production ? 'prod' : 'dev'})\x1b[0m built in`;
    console.time(timer);

    await Promise.all([
        build({
            ...pyScriptConfig,
            sourcemap: false,
            minify: false,
            outfile: 'build/pyscript.js',
        }),
        build({
            ...pyScriptConfig,
            sourcemap: true,
            minify: true,
            outfile: 'build/pyscript.min.js',
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
