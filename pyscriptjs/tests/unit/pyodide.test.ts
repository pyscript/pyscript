import type { AppConfig } from '../../src/pyconfig';
import { InterpreterClient } from '../../src/interpreter_client';
import { CaptureStdio } from '../../src/stdio';
import * as Synclink from 'synclink';
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
// We can't import RemoteInterpreter at top level because we need to mock the
// Python package in setup.ts
// But we can import the types at top level.
// TODO: is there a better way to handle this?
import type { RemoteInterpreter } from '../../src/remote_interpreter';

describe('RemoteInterpreter', () => {
    let interpreter: InterpreterClient;
    let stdio: CaptureStdio = new CaptureStdio();
    let RemoteInterpreter;
    const { port1, port2 } = new Synclink.FakeMessageChannel() as unknown as MessageChannel;
    beforeAll(async () => {
        const SRC = '../pyscriptjs/node_modules/pyodide/pyodide.js';
        const config: AppConfig = { interpreters: [{ src: SRC }] };
        // Dynamic import of RemoteInterpreter sees our mocked Python package.
        ({ RemoteInterpreter } = await import('../../src/remote_interpreter'));
        const remote_interpreter = new RemoteInterpreter(SRC);

        port1.start();
        port2.start();
        Synclink.expose(remote_interpreter, port2);
        const wrapped_remote_interpreter = Synclink.wrap(port1);
        interpreter = new InterpreterClient(
            config,
            stdio,
            wrapped_remote_interpreter as Synclink.Remote<RemoteInterpreter>,
            remote_interpreter,
        );

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

    afterAll(async () => {
        port1.close();
        port2.close();
    });

    it('should check if interpreter is an instance of abstract Interpreter', async () => {
        expect(interpreter).toBeInstanceOf(InterpreterClient);
    });

    it('should check if interpreter is an instance of RemoteInterpreter', async () => {
        expect(interpreter._unwrapped_remote).toBeInstanceOf(RemoteInterpreter);
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
        stdio.reset();
        await interpreter._unwrapped_remote.loadPackage('numpy');
        await interpreter.run('import numpy as np');
        await interpreter.run('x = np.ones((10,))');
        await interpreter.run('print(x)');
        expect(stdio.captured_stdout).toBe('[1. 1. 1. 1. 1. 1. 1. 1. 1. 1.]\n');
    });
});
