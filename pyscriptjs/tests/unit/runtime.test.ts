import 'jest';
import { Runtime } from '../../src/runtime';
import { PyodideRuntime } from '../../src/pyodide';

jest.mock('../../src/python/pyscript.py');

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

    // test('empty string should result in zero', () => {
    //   expect(add('')).toBe(0);
    // });
  });
