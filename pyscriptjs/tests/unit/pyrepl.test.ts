import 'jest';
import { PyRepl } from '../../src/components/pyrepl';

const xPyRepl = customElements.define('py-repl', PyRepl);

describe('PyRepl', () => {
    // let instance = new PyRepl();

    beforeEach(() => {
        // instance = new PyRepl();
    });

    it('should get the current Repl to just instantiate', async () => {
        const instance = new PyRepl();
        expect(instance).toBeInstanceOf(PyRepl);
    });

});
