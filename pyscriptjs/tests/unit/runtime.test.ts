import type { AppConfig } from '../../src/pyconfig';
import { Runtime } from '../../src/runtime';
import { PyodideRuntime } from '../../src/pyodide';

import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

describe('PyodideRuntime', () => {
    let runtime: PyodideRuntime;
    beforeAll(async () => {
        const config: AppConfig = {};
        runtime = new PyodideRuntime(config);
        /**
         * Since import { loadPyodide } from 'pyodide';
         * is not used inside `src/pyodide.ts`, the function
         * `runtime.loadInterpreter();` below which calls
         * `loadPyodide()` results in an expected issue of:
         *   ReferenceError: loadPyodide is not defined
         *
         * To make jest happy, while also not importing
         * explicitly inside `src/pyodide.ts`, the
         * following lines - so as to dynamically import
         * and make it available in the global namespace
         * - are used.
         *
         * Pyodide uses a "really hacky" method to get the
         * URL/Path where packages/package data are stored;
         * it throws an error, catches it, and parses it. In
         * Jest, this calculated path is different than in
         * the browser/Node, so files cannot be found and the
         * test fails. We set indexURL below the correct location
         * to fix this.
         * See https://github.com/pyodide/pyodide/blob/7dfee03a82c19069f714a09da386547aeefef242/src/js/pyodide.ts#L161-L179
         */
        const pyodideSpec = await import('pyodide');
        global.loadPyodide = async (options) => pyodideSpec.loadPyodide(Object.assign({indexURL: '../pyscriptjs/node_modules/pyodide/'}, options));
        await runtime.loadInterpreter();
    });

    it('should check if runtime is an instance of abstract Runtime', async () => {
        expect(runtime).toBeInstanceOf(Runtime);
    });

    it('should check if runtime is an instance of PyodideRuntime', async () => {
        expect(runtime).toBeInstanceOf(PyodideRuntime);
    });

    it('should check if runtime can run python code asynchronously', async () => {
        expect(await runtime.run("2+3")).toBe(5);
    });

    it('should check if runtime is able to load a package', async () => {
        await runtime.loadPackage("numpy");
        await runtime.run("import numpy as np");
        await runtime.run("x = np.ones((10,))");
        expect(runtime.globals.get('x').toJs()).toBeInstanceOf(Float64Array);
    });

  });
