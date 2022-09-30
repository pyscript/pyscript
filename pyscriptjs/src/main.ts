import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import { PyScript } from './components/pyscript';
import { PyEnv } from './components/pyenv';
import { PyLoader } from './components/pyloader';
import { PyodideRuntime } from './pyodide';
import { getLogger } from './logger';
import { globalLoader, runtimeLoaded, addInitializer } from './stores';
import { handleFetchError, globalExport } from './utils'

const logger = getLogger('pyscript/main');

// XXX this should be killed eventually
let runtimeSpec: Runtime;
runtimeLoaded.subscribe(value => {
    runtimeSpec = value;
});


class PyScriptApp {

    config: AppConfig;

    main() {
        this.loadConfig();
        this.initialize();

        /* eslint-disable @typescript-eslint/no-unused-vars */
        const xPyScript = customElements.define('py-script', PyScript);
        const xPyLoader = customElements.define('py-loader', PyLoader);
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
        logger.info('config loaded:\n' + JSON.stringify(this.config, null, 2));
    }

    initialize() {
        addInitializer(this.loadPackages);
        addInitializer(this.loadPaths);
        this.loadRuntimes();
    }

    loadPackages = async () => {
        logger.info("Packages to install: ", this.config.packages);
        await runtimeSpec.installPackage(this.config.packages);
    }

    loadPaths = async () => {
        const paths = this.config.paths;
        logger.info("Paths to load: ", paths)
        for (const singleFile of paths) {
            logger.info(`  loading path: ${singleFile}`);
            try {
                await runtimeSpec.loadFromFile(singleFile);
            } catch (e) {
                //Should we still export full error contents to console?
                handleFetchError(<Error>e, singleFile);
            }
        }
        logger.info("All paths loaded");
    }

    loadRuntimes() {
        logger.info('Initializing runtimes');
        for (const runtime of this.config.runtimes) {
            const runtimeObj: Runtime = new PyodideRuntime(this.config, runtime.src,
                                                           runtime.name, runtime.lang);
            const script = document.createElement('script'); // create a script DOM node
            script.src = runtimeObj.src; // set its src to the provided URL
            script.addEventListener('load', () => {
                void runtimeObj.initialize();
            });
            document.head.appendChild(script);
        }
    }

}

function pyscript_get_config() {
    return globalApp.config;
}
globalExport('pyscript_get_config', pyscript_get_config);

// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();
