import 'jest';
import { PyRepl } from '../../src/components/pyrepl';

customElements.define('py-repl', PyRepl);

describe('PyRepl', () => {
    let instance: PyRepl;
    beforeEach(() => {
        instance = new PyRepl();
    });

    it('should get the current Repl to just instantiate', async () => {
        expect(instance).toBeInstanceOf(PyRepl);
    });

});
