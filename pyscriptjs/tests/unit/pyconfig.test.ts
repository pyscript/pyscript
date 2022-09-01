import type { AppConfig, RuntimeConfig } from '../../src/runtime';
import { PyConfig } from '../../src/components/pyconfig';

customElements.define('py-config', PyConfig);

describe('PyConfig', () => {
    let instance: PyConfig;
    beforeEach(() => {
        instance = new PyConfig();
        let runtime_config: RuntimeConfig = {src: "/demo/covfefe.js", name: "covfefe", lang: "covfefe"};
        let app_config: AppConfig = {autoclose_loader: true, runtimes: [runtime_config]};
        instance.values = app_config;
    });

    it('should get the Config to just instantiate', async () => {
        expect(instance).toBeInstanceOf(PyConfig);
    });

    it('should load runtime from config and set as script src', () => {
        instance.loadRuntimes();
        expect(document.scripts[0].src).toBe("http://localhost/demo/covfefe.js");
    });
});
