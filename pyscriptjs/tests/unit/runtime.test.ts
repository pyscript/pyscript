import { Runtime } from '../../src/runtime';
import { PyodideRuntime } from '../../src/pyodide';

import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

describe('PyodideRuntime', () => {
    let runtime: PyodideRuntime;
    beforeEach(() => {
        runtime = new PyodideRuntime();
    });

    it('should check if runtime is an instance of abstract Runtime', async () => {
        expect(runtime).toBeInstanceOf(Runtime);
    });

    it('should check if runtime is an instance of PyodideRuntime', async () => {
        expect(runtime).toBeInstanceOf(PyodideRuntime);
    });

    it('should check if runtime can run python code', async () => {
        await runtime.initialize();
        expect(runtime.run("2+2")).toBe(4);
    });
  });
