import './styles/pyscript_base.css';

import { PyScript } from './components/pyscript';
import { PyEnv } from './components/pyenv';
import { PyLoader } from './components/pyloader';
import { PyConfig } from './components/pyconfig';
import { getLogger } from './logger';
import { globalLoader } from './stores';

const logger = getLogger('pyscript/main');

class PyScriptApp {

    main() {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const xPyScript = customElements.define('py-script', PyScript);
        const xPyLoader = customElements.define('py-loader', PyLoader);
        const xPyConfig = customElements.define('py-config', PyConfig);
        const xPyEnv = customElements.define('py-env', PyEnv);
        /* eslint-disable @typescript-eslint/no-unused-vars */

        // As first thing, loop for application configs
        logger.info('checking for py-config');
        const config: PyConfig = document.querySelector('py-config');
        if (!config) {
            const loader = document.createElement('py-config');
            document.body.append(loader);
        }

        // add loader to the page body
        logger.info('add py-loader');
        const loader = <PyLoader>document.createElement('py-loader');
        document.body.append(loader);
        globalLoader.set(loader);
    }
}


// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();
