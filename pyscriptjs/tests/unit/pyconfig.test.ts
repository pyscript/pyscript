import { jest } from '@jest/globals';
import type { AppConfig, RuntimeConfig } from '../../src/config';
import { loadConfigFromElement, defaultConfig } from '../../src/config';

// inspired by trump typos
const covfefeConfig = {
    name: 'covfefe',
    runtimes: [
        {
            src: '/demo/covfefe.js',
            name: 'covfefe',
            lang: 'covfefe',
        },
    ],
    wonerful: 'discgrace',
};

const covfefeConfigToml = `
name = "covfefe"

wonerful = "highjacked"

[[runtimes]]
src = "/demo/covfefe.js"
name = "covfefe"
lang = "covfefe"
`;


// ideally, I would like to be able to just do "new HTMLElement" in the tests
// below, but it is not permitted. The easiest work around is to create a fake
// custom element: not that we are not using any specific feature of custom
// elements: the sole purpose to FakeElement is to be able to instantiate them
// in the tests.
class FakeElement extends HTMLElement {
    constructor() {
        super();
    }
}
customElements.define('fake-element', FakeElement);


describe('loadConfigFromElement', () => {
    let element: HTMLElement;

    const xhrMockClass = () => ({
        open: jest.fn(),
        send: jest.fn(),
        responseText: JSON.stringify(covfefeConfig),
    });
    // @ts-ignore
    window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

    beforeEach(() => {
        element = new FakeElement();
    });

    it('FakeElement can be instantiated', async () => {
        expect(element).toBeInstanceOf(HTMLElement);
    });


    // XXX fix me
    // it('should load the default config', () => {
    //     const config = loadConfigFromElement(null);
    //     expect(config).toBe(defaultConfig);
    // });

    it('an empty <py-config> should load the default config', () => {
        let config = loadConfigFromElement(element);
        expect(config).toBe(defaultConfig);
    });

    /*
    it('should load the JSON config from inline', () => {
        instance.setAttribute('type', 'json');
        instance.innerHTML = JSON.stringify(covfefeConfig);
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe('covfefe');
        expect(instance.values.pyscript?.time).not.toBeNull();
        // version wasn't present in `inline config` but is still set due to merging with default
        expect(instance.values.version).toBe('0.1');
    });

    it('should load the JSON config from src attribute', () => {
        instance.setAttribute('type', 'json');
        instance.setAttribute('src', '/covfefe.json');
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe('covfefe');
        expect(instance.values.pyscript?.time).not.toBeNull();
        // wonerful is an extra key supplied by the user and is unaffected by merging process
        expect(instance.values.wonerful).toBe('discgrace');
        // version wasn't present in `config from src` but is still set due to merging with default
        expect(instance.values.version).toBe('0.1');
    });

    it('should load the JSON config from both inline and src', () => {
        instance.setAttribute('type', 'json');
        instance.innerHTML = JSON.stringify({ version: '0.2a', wonerful: 'highjacked' });
        instance.setAttribute('src', '/covfefe.json');
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe('covfefe');
        expect(instance.values.pyscript?.time).not.toBeNull();
        // config from src had an extra key "wonerful" with value "discgrace"
        // inline config had the same extra key "wonerful" with value "highjacked"
        // the merge process works for extra keys that clash as well
        // so the final value is "highjacked" since inline takes precedence over src
        expect(instance.values.wonerful).toBe('highjacked');
        // version wasn't present in `config from src` but is still set due to merging with default and inline
        expect(instance.values.version).toBe('0.2a');
    });

    it('should be able to load an inline TOML config', () => {
        // type of config is TOML if not supplied
        instance.innerHTML = covfefeConfigToml;
        instance.connectedCallback();
        // @ts-ignore
        expect(instance.values.runtimes[0].lang).toBe('covfefe');
        expect(instance.values.pyscript?.time).not.toBeNull();
        // version wasn't present in `inline config` but is still set due to merging with default
        expect(instance.values.version).toBe('0.1');
        expect(instance.values.wonerful).toBe('highjacked');
    });

    it.failing('should NOT be able to load an inline config in JSON format with type as TOML', () => {
        instance.innerHTML = JSON.stringify(covfefeConfig);
        instance.connectedCallback();
    });

    it.failing('should NOT be able to load an inline config in TOML format with type as JSON', () => {
        instance.setAttribute('type', 'json');
        instance.innerHTML = covfefeConfigToml;
        instance.connectedCallback();
    });

    it.failing('should NOT be able to load an inline TOML config with a JSON config from src with type as toml', () => {
        instance.innerHTML = covfefeConfigToml;
        instance.setAttribute('src', '/covfefe.json');
        instance.connectedCallback();
    });

    it.failing('should NOT be able to load an inline TOML config with a JSON config from src with type as json', () => {
        instance.setAttribute('type', 'json');
        instance.innerHTML = covfefeConfigToml;
        instance.setAttribute('src', '/covfefe.json');
        instance.connectedCallback();
    });

    it('connectedCallback should call loadRuntimes', async () => {
        const mockedMethod = jest.fn();
        instance.loadRuntimes = mockedMethod;

        instance.connectedCallback();

        expect(mockedMethod).toHaveBeenCalled();
    });

    it('confirm connectedCallback happy path', async () => {
        const mockedMethod = jest.fn();
        instance.loadRuntimes = mockedMethod;
        instance.innerHTML = 'test';

        instance.connectedCallback();

        expect(instance.values['0']).toBe('test');
    });

    it('log should add new message to the page', async () => {
        // details are undefined, so let's create a div for it
        instance.details = document.createElement('div');
        instance.log('this is a log');

        // @ts-ignore: typescript complains about accessing innerText
        expect(instance.details.childNodes[0].innerText).toBe('this is a log');
    });

    it('confirm that calling close would call this.remove', async () => {
        instance.remove = jest.fn();
        instance.close();
        expect(instance.remove).toHaveBeenCalled();
    });
    */
});


// old tests about PyConfig.connectedCallback behavior, should be moved
// somewhere else

import { PyConfig } from '../../src/components/pyconfig';
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
        expect(document.scripts[0].src).toBe('http://localhost/demo/covfefe.js');
    });
})
