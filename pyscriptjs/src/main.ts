import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import { PyScript } from './components/pyscript';
import { PyLoader } from './components/pyloader';
import { PyodideRuntime } from './pyodide';
import { getLogger } from './logger';
import { globalLoader, runtimeLoaded, addInitializer } from './stores';
import { handleFetchError, showError, globalExport } from './utils'

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
        // XXX: we should actively complain if there are multiple <py-config>
        // and show a big error. PRs welcome :)
        logger.info('searching for <py-config>');
        const elements = document.getElementsByTagName('py-config');
        let el = null;
        if (elements.length > 0)
            el = elements[0];
        if (elements.length >= 2) {
            // XXX: ideally, I would like to have a way to raise "fatal
            // errors" and stop the computation, but currently our life cycle
            // is too messy to implement it reliably. We might want to revisit
            // this once it's in a better shape.
            showError("Multiple &lt;py-config&gt; tags detected. Only the first is " +
                      "going to be parsed, all the others will be ignored");
        }
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
        if (this.config.runtimes.length == 0) {
            showError("Fatal error: config.runtimes is empty");
            return;
        }

        if (this.config.runtimes.length > 1) {
            showError("Multiple runtimes are not supported yet. " +
                      "Only the first will be used");
        }
        const runtime_cfg = this.config.runtimes[0];
        const runtime: Runtime = new PyodideRuntime(this.config, runtime_cfg.src,
                                                    runtime_cfg.name, runtime_cfg.lang);
        const script = document.createElement('script'); // create a script DOM node
        script.src = runtime.src;
        script.addEventListener('load', () => {
            void runtime.initialize();
        });
        document.head.appendChild(script);
    }
}

function pyscript_get_config() {
    return globalApp.config;
}
globalExport('pyscript_get_config', pyscript_get_config);

// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();
