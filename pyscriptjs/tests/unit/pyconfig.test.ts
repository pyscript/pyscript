import { PyConfig } from '../../src/components/pyconfig';
// eslint-disable-next-line
// @ts-ignore
import covfefeConfig from './covfefe.json';
import {jest} from '@jest/globals';

customElements.define('py-config', PyConfig);

describe('PyConfig', () => {
    let instance: PyConfig;
    beforeEach(() => {
        instance = new PyConfig();
    });

    it('should get the Config to just instantiate', async () => {
        expect(instance).toBeInstanceOf(PyConfig);
    });

    it('should load runtime from config and set as script src', () => {
        instance.values = covfefeConfig;
        instance.loadRuntimes();
        expect(document.scripts[0].src).toBe("http://localhost/demo/covfefe.js");
    });

    it('should load the default config from pyscript.json', ()=> {
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("python");
    });

    it('should load the config from inline', ()=> {
        instance.innerHTML = JSON.stringify(covfefeConfig);
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.version).toBe("0.1");
    });

    it('should load the config from src attribute', ()=> {
        const xhrMockClass = () => ({
            open            : jest.fn(),
            send            : jest.fn(),
            responseText    : JSON.stringify(covfefeConfig)
        });
        // @ts-ignore
        window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass)
        instance.setAttribute("src", "/covfefe.json");
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.version).toBe("0.1");
    });
});
