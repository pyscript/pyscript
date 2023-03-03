import type { AppConfig } from '../../src/pyconfig';
import { InterpreterClient } from '../../src/interpreter_client';
import { RemoteInterpreter } from '../../src/remote_interpreter';
import { CaptureStdio } from '../../src/stdio';

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('RemoteInterpreter', () => {
    let interpreter: InterpreterClient;
    let stdio: CaptureStdio = new CaptureStdio();
    beforeAll(async () => {
        const config: AppConfig = {interpreters: [{src: "../pyscriptjs/node_modules/pyodide/pyodide.js"}]};
        interpreter = new InterpreterClient(config, stdio);

        /**
         * Since import { loadPyodide } from 'pyodide';
         * is not used inside `src/pyodide.ts`, the function
         * `interpreter.loadInterpreter();` below which calls
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
        global.loadPyodide = async options =>
            pyodideSpec.loadPyodide(Object.assign({ indexURL: '../pyscriptjs/node_modules/pyodide/' }, options));
        await interpreter.initializeRemote();
    });

    it('should check if interpreter is an instance of abstract Interpreter', async () => {
        expect(interpreter).toBeInstanceOf(InterpreterClient);
    });

    it('should check if interpreter is an instance of RemoteInterpreter', async () => {
        expect(interpreter._remote).toBeInstanceOf(RemoteInterpreter);
    });

    it('should check if interpreter can run python code asynchronously', async () => {
        expect((await interpreter.run('2+3')).result).toBe(5);
    });

    it('should capture stdout', async () => {
        stdio.reset();
        await interpreter.run("print('hello')");
        expect(stdio.captured_stdout).toBe('hello\n');
    });

    it('should check if interpreter is able to load a package', async () => {
        await interpreter._remote.loadPackage('numpy');
        await interpreter.run('import numpy as np');
        await interpreter.run('x = np.ones((10,))');
        expect(interpreter.globals.get('x').toJs()).toBeInstanceOf(Float64Array);
    });
});
