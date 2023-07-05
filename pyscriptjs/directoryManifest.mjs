// This logic split out because it is shared by:
// 1. esbuild.mjs
// 2. Jest setup.ts

import path, { join } from 'path';
import { opendir, readFile } from 'fs/promises';

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
export async function directoryManifest(dir) {
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
            result.files.push([normalizePath(entry), await readFile(join(root, entry), { encoding: 'utf-8' })]);
        }
    }
}

/**
 * Normalize paths under different operating systems to
 * the correct path that will be used for src on browser.
 * @param {string} originalPath
 */
function normalizePath(originalPath) {
    return path.normalize(originalPath).replace(/\\/g, '/');
}
