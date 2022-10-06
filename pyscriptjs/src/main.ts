import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import { PyScript } from './components/pyscript';
import { PyLoader } from './components/pyloader';
import { PyodideRuntime } from './pyodide';
import { getLogger } from './logger';
import {
    addInitializer,
    addPostInitializer,
    runtimeLoaded,
    globalLoader,
    initializers,
    postInitializers,
    Initializer,
    scriptsQueue,
} from './stores';
import { handleFetchError, showError, globalExport } from './utils'
import { createCustomElements } from './components/elements';


const logger = getLogger('pyscript/main');

// XXX this should be killed eventually
let runtimeSpec: Runtime;
runtimeLoaded.subscribe(value => {
    runtimeSpec = value;
});

let initializers_: Initializer[];
initializers.subscribe((value: Initializer[]) => {
    initializers_ = value;
});

let postInitializers_: Initializer[];
postInitializers.subscribe((value: Initializer[]) => {
    postInitializers_ = value;
});

let scriptsQueue_: PyScript[];
scriptsQueue.subscribe((value: PyScript[]) => {
    scriptsQueue_ = value;
});



/* High-level overview of the lifecycle of a PyScript App:

   1. pyscript.js is loaded by the browser. PyScriptApp().main() is called

   2. loadConfig(): search for py-config and compute the config for the app

   3. show the loader/splashscreen

   4. loadRuntime(): start downloading the actual runtime (e.g. pyodide.js)

   --- wait until (4) has finished ---

   5. now the pyodide src is available. Initialize the engine

   6. setup the environment, install packages

   7. run user scripts

More concretely:

  - Points 1-4 are implemented sequentially in PyScriptApp.main().

  - PyScriptApp.loadRuntime adds a <script> tag to the document to initiate
    the download, and then adds an event listener for the 'load' event, which
    in turns calls PyScriptApp.afterRuntimeLoad().

  - PyScriptApp.afterRuntimeLoad() implements all the points >= 5.
*/


class PyScriptApp {

    config: AppConfig;
    loader: PyLoader;

    // lifecycle (1)
    main() {
        this.loadConfig();

        // XXX this needs refactoring: they implement lifecycle (6) and they
        // are called by afterRuntimeLoad
        addInitializer(this.loadPackages);
        addInitializer(this.loadPaths);

        // lifecycle (3)
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const xPyScript = customElements.define('py-script', PyScript);
        const xPyLoader = customElements.define('py-loader', PyLoader);
        /* eslint-disable @typescript-eslint/no-unused-vars */

        // add loader to the page body
        logger.info('add py-loader');
        this.loader = <PyLoader>document.createElement('py-loader');
        document.body.append(this.loader);

        this.loadRuntime();
    }

    // lifecycle (2)
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

    // XXX this should probably be moved around
    loadPackages = async () => {
        logger.info("Packages to install: ", this.config.packages);
        await runtimeSpec.installPackage(this.config.packages);
    }

    // XXX this should probably be moved around
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

    // lifecycle (3)
    loadRuntime() {
        logger.info('Initializing runtime');
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
        this.loader.log('Loading runtime...');
        const script = document.createElement('script'); // create a script DOM node
        script.src = runtime.src;
        script.addEventListener('load', () => {
            void this.afterRuntimeLoad(runtime);
        });
        document.head.appendChild(script);
    }

    // lifecycle (5). See the overview comment above for an explanation of how
    // we jump from point (4) to point (5).

    // Invariant: this.config and this.loader are set and available.
    async afterRuntimeLoad(runtime: Runtime): Promise<void> {
        // XXX what is the JS/TS standard way of doing asserts?
        console.assert(this.config !== undefined);
        console.assert(this.loader !== undefined);

        this.loader.log('Loading runtime...');
        await runtime.loadInterpreter();
        runtimeLoaded.set(runtime);

        // Inject the loader into the runtime namespace
        // eslint-disable-next-line
        runtime.globals.set('pyscript_loader', this.loader);

        this.loader.log('Runtime created...');

        // now we call all initializers before we actually executed all page scripts
        this.loader.log('Initializing components...');
        for (const initializer of initializers_) {
            await initializer();
        }

        this.loader.log('Initializing scripts...');
        for (const script of scriptsQueue_) {
            void script.evaluate();
        }
        scriptsQueue.set([]);

        // now we call all post initializers AFTER we actually executed all page scripts
        this.loader.log('Running post initializers...');

        // Finally create the custom elements for pyscript such as pybutton
        createCustomElements();

        if (runtime.config.autoclose_loader) {
            this.loader.close();
        }

        for (const initializer of postInitializers_) {
            await initializer();
        }
        // NOTE: runtime message is used by integration tests to know that
        // pyscript initialization has complete. If you change it, you need to
        // change it also in tests/integration/support.py
        logger.info('PyScript page fully initialized');
    }

}

function pyscript_get_config() {
    return globalApp.config;
}
globalExport('pyscript_get_config', pyscript_get_config);

// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();
