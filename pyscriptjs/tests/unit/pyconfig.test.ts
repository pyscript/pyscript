import { jest } from '@jest/globals';
import type { AppConfig, RuntimeConfig } from '../../src/config';
import { loadConfigFromElement, defaultConfig } from '../../src/config';
import { version } from '../../src/runtime';

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
    wonderful: 'disgrace',
};

const covfefeConfigToml = `
name = "covfefe"

wonderful = "hijacked"

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

function make_config_element(attrs) {
    const el = new FakeElement();
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value as string);
    }
    return el;
}


describe('loadConfigFromElement', () => {
    const xhrMockClass = () => ({
        open: jest.fn(),
        send: jest.fn(),
        responseText: JSON.stringify(covfefeConfig),
    });
    // @ts-ignore
    window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

    it('should load the default config', () => {
        const config = loadConfigFromElement(null);
        expect(config).toBe(defaultConfig);
        expect(config.pyscript.version).toBe(version);
    });

    it('an empty <py-config> should load the default config', () => {
        const el = make_config_element({});
        let config = loadConfigFromElement(el);
        expect(config).toBe(defaultConfig);
        expect(config.pyscript.version).toBe(version);
    });

    it('should load the JSON config from inline', () => {
        const el = make_config_element({ type: 'json' });
        el.innerHTML = JSON.stringify(covfefeConfig);
        const config = loadConfigFromElement(el);
        expect(config.runtimes[0].lang).toBe('covfefe');
        expect(config.pyscript?.time).not.toBeNull();
        // version wasn't present in `inline config` but is still set due to merging with default
        expect(config.version).toBe('0.1');
    });

    it('should load the JSON config from src attribute', () => {
        const el = make_config_element({ type: 'json', src: '/covfefe.json' });
        const config = loadConfigFromElement(el);
        expect(config.runtimes[0].lang).toBe('covfefe');
        expect(config.pyscript?.time).not.toBeNull();
        // wonderful is an extra key supplied by the user and is unaffected by merging process
        expect(config.wonderful).toBe('disgrace');
        // version wasn't present in `config from src` but is still set due to merging with default
        expect(config.version).toBe('0.1');
    });


    it('should load the JSON config from both inline and src', () => {
        const el = make_config_element({ type: 'json', src: '/covfefe.json' });
        el.innerHTML = JSON.stringify({ version: '0.2a', wonderful: 'hijacked' });
        const config = loadConfigFromElement(el);
        expect(config.runtimes[0].lang).toBe('covfefe');
        expect(config.pyscript?.time).not.toBeNull();
        // config from src had an extra key "wonderful" with value "disgrace"
        // inline config had the same extra key "wonderful" with value "hijacked"
        // the merge process works for extra keys that clash as well
        // so the final value is "hijacked" since inline takes precedence over src
        expect(config.wonderful).toBe('hijacked');
        // version wasn't present in `config from src` but is still set due to merging with default and inline
        expect(config.version).toBe('0.2a');
    });

    it('should be able to load an inline TOML config', () => {
        // TOML is the default type
        const el = make_config_element({});
        el.innerHTML = covfefeConfigToml;
        const config = loadConfigFromElement(el);
        expect(config.runtimes[0].lang).toBe('covfefe');
        expect(config.pyscript?.time).not.toBeNull();
        // version wasn't present in `inline config` but is still set due to merging with default
        expect(config.version).toBe('0.1');
        expect(config.wonderful).toBe('hijacked');
    });

    it.failing('should NOT be able to load an inline config in JSON format with type as TOML', () => {
        const el = make_config_element({});
        el.innerHTML = JSON.stringify(covfefeConfig);
        loadConfigFromElement(el);
    });

    it.failing('should NOT be able to load an inline config in TOML format with type as JSON', () => {
        const el = make_config_element({ type: 'json' });
        el.innerHTML = covfefeConfigToml;
        loadConfigFromElement(el);
    });

    it.failing('should NOT be able to load an inline TOML config with a JSON config from src with type as toml', () => {
        const el = make_config_element({ src: '/covfefe.json' });
        el.innerHTML = covfefeConfigToml;
        loadConfigFromElement(el);
    });

    it.failing('should NOT be able to load an inline TOML config with a JSON config from src with type as json', () => {
        const el = make_config_element({ type: 'json', src: '/covfefe.json' });
        el.innerHTML = covfefeConfigToml;
        loadConfigFromElement(el);
    });
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
})
