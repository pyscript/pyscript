import './styles/pyscript_base.css';

import { loadConfigFromElement } from './config';
import type { AppConfig } from './config';
import { PyScript } from './components/pyscript';
import { PyEnv } from './components/pyenv';
import { PyLoader } from './components/pyloader';
import { PyConfig } from './components/pyconfig';
import { getLogger } from './logger';
import { globalLoader, appConfig } from './stores';

const logger = getLogger('pyscript/main');

class PyScriptApp {

    config: AppConfig;

    main() {
        this.loadConfig();

        /* eslint-disable @typescript-eslint/no-unused-vars */
        const xPyScript = customElements.define('py-script', PyScript);
        const xPyLoader = customElements.define('py-loader', PyLoader);
        //const xPyConfig = customElements.define('py-config', PyConfig);
        const xPyEnv = customElements.define('py-env', PyEnv);
        /* eslint-disable @typescript-eslint/no-unused-vars */

        // add loader to the page body
        logger.info('add py-loader');
        const loader = <PyLoader>document.createElement('py-loader');
        document.body.append(loader);
        globalLoader.set(loader);
    }

    loadConfig() {
        // find the <py-config> tag. If not found, we get null which means
        // "use the default config"
        // XXX: what happens if we have multiple ones?
        logger.info('searching for <py-config>');
        const el = document.querySelector('py-config');
        this.config = loadConfigFromElement(el);
        logger.info('config loaded:', this.config);

        // XXX kill me eventually
        const py_config = new PyConfig(this.config);
        py_config.connectedCallback();
    }

}


// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();
