import { PyConfig } from '../../src/components/pyconfig';
// inspired by trump typos
const covfefeConfig = {
    "name": "covfefe",
    "runtimes": [{
        "src": "/demo/covfefe.js",
        "name": "covfefe",
        "lang": "covfefe"
    }],
    "wonerful": "discgrace"
};

const covfefeConfigToml = `
name = "covfefe"

wonerful = "highjacked"

[[runtimes]]
src = "/demo/covfefe.js"
name = "covfefe"
lang = "covfefe"
`;

import {jest} from '@jest/globals';

customElements.define('py-config', PyConfig);

describe('PyConfig', () => {
    let instance: PyConfig;

    const xhrMockClass = () => ({
        open            : jest.fn(),
        send            : jest.fn(),
        responseText    : JSON.stringify(covfefeConfig)
    });
    // @ts-ignore
    window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass)

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

    it('should load the default config', ()=> {
        instance.connectedCallback();
        expect(instance.values.name).toBe("pyscript");
        expect(instance.values.author_email).toBe("foo@bar.com");
        expect(instance.values.pyscript?.time).not.toBeNull();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("python");
    });

    it('should load the config from inline', ()=> {
        instance.innerHTML = JSON.stringify(covfefeConfig);
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.pyscript?.time).not.toBeNull();
        // version wasn't present in `inline config` but is still set due to merging with default
        expect(instance.values.version).toBe("0.1");
    });

    it('should load the config from src attribute', ()=> {
        instance.setAttribute("src", "/covfefe.json");
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.pyscript?.time).not.toBeNull();
        // wonerful is an extra key supplied by the user and is unaffected by merging process
        expect(instance.values.wonerful).toBe("discgrace");
        // version wasn't present in `config from src` but is still set due to merging with default
        expect(instance.values.version).toBe("0.1");
    });

    it('should load the config from both inline and src', ()=> {
        instance.innerHTML = JSON.stringify({"version": "0.2a", "wonerful": "highjacked"});
        instance.setAttribute("src", "/covfefe.json");
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.pyscript?.time).not.toBeNull();
        // config from src had an extra key "wonerful" with value "discgrace"
        // inline config had the same extra key "wonerful" with value "highjacked"
        // the merge process works for extra keys that clash as well
        // so the final value is "highjacked" since inline takes precedence over src
        expect(instance.values.wonerful).toBe("highjacked");
        // version wasn't present in `config from src` but is still set due to merging with default and inline
        expect(instance.values.version).toBe("0.2a");
    });

    it('should be able to load an inline config in TOML format', () => {
        instance.innerHTML = covfefeConfigToml;
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.pyscript?.time).not.toBeNull();
        // version wasn't present in `inline config` but is still set due to merging with default
        expect(instance.values.version).toBe("0.1");
        expect(instance.values.wonerful).toBe("highjacked");
    });

    it('should be able to load an inline config in TOML format and a JSON config from src attribute', () => {
        instance.innerHTML = covfefeConfigToml;
        instance.setAttribute("src", "/covfefe.json");
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe("covfefe");
        expect(instance.values.pyscript?.time).not.toBeNull();
        // config from src (JSON) had an extra key "wonerful" with value "discgrace"
        // inline config (TOML) had the same extra key "wonerful" with value "highjacked"
        // the merge process works for extra keys that clash as well
        // so the final value is "highjacked" since inline takes precedence over src
        expect(instance.values.wonerful).toBe("highjacked");
        // version wasn't present in `config from src` but is still set due to merging with default
        expect(instance.values.version).toBe("0.1");
    });
});
