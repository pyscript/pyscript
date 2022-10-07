import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import { PyScript, initHandlers, mountElements } from './components/pyscript';
import { PyLoader } from './components/pyloader';
import { PyodideRuntime } from './pyodide';
import { getLogger } from './logger';
import {
    runtimeLoaded,
    scriptsQueue,
} from './stores';
import { handleFetchError, showError, globalExport } from './utils'
import { createCustomElements } from './components/elements';


const logger = getLogger('pyscript/main');

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

   8. initialize the rest of web components such as py-button, py-repl, etc.

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
        customElements.define('py-script', PyScript);
        this.showLoader();
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

    // lifecycle (3)
    showLoader() {
        // add loader to the page body
        logger.info('add py-loader');
        customElements.define('py-loader', PyLoader);
        this.loader = <PyLoader>document.createElement('py-loader');
        document.body.append(this.loader);
    }

    // lifecycle (4)
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
        this.loader.log(`Downloading ${runtime_cfg.name}...`);
        const script = document.createElement('script'); // create a script DOM node
        script.src = runtime.src;
        script.addEventListener('load', () => {
            void this.afterRuntimeLoad(runtime);
        });
        document.head.appendChild(script);
    }

    // lifecycle (5)
    // See the overview comment above for an explanation of how we jump from
    // point (4) to point (5).
    //
    // Invariant: this.config and this.loader are set and available.
    async afterRuntimeLoad(runtime: Runtime): Promise<void> {
        // XXX what is the JS/TS standard way of doing asserts?
        console.assert(this.config !== undefined);
        console.assert(this.loader !== undefined);

        this.loader.log('Python startup...');
        await runtime.loadInterpreter();
        runtimeLoaded.set(runtime);
        this.loader.log('Python ready!');

        // eslint-disable-next-line
        runtime.globals.set('pyscript_loader', this.loader);

        this.loader.log('Setting up virtual environment...');
        await this.setupVirtualEnv(runtime);
        await mountElements(runtime);

        this.loader.log('Executing <py-script> tags...');
        this.executeScripts(runtime);

        this.loader.log('Initializing web components...');
        // lifecycle (8)
        createCustomElements();

        if (runtime.config.autoclose_loader) {
            this.loader.close();
        }
        await initHandlers(runtime);

        // NOTE: runtime message is used by integration tests to know that
        // pyscript initialization has complete. If you change it, you need to
        // change it also in tests/integration/support.py
        logger.info('PyScript page fully initialized');
    }


    // lifecycle (6)
    async setupVirtualEnv(runtime: Runtime): Promise<void> {
        // XXX: maybe the following calls could be parallelized, instead of
        // await()ing immediately. For now I'm using await to be 100%
        // compatible with the old behavior.
        logger.info("Packages to install: ", this.config.packages);
        await runtime.installPackage(this.config.packages);
        await this.fetchPaths(runtime);
    }

    async fetchPaths(runtime: Runtime) {
        // XXX this can be VASTLY improved: for each path we need to fetch a
        // URL and write to the virtual filesystem: pyodide.loadFromFile does
        // it in Python, which means we need to have the runtime
        // initialized. But we could easily do it in JS in parallel with the
        // download/startup of pyodide.
        const paths = this.config.paths;
        logger.info("Paths to fetch: ", paths)
        for (const singleFile of paths) {
            logger.info(`  fetching path: ${singleFile}`);
            try {
                await runtime.loadFromFile(singleFile);
            } catch (e) {
                //Should we still export full error contents to console?
                handleFetchError(<Error>e, singleFile);
            }
        }
        logger.info("All paths fetched");
    }

    // lifecycle (7)
    executeScripts(runtime: Runtime) {
        for (const script of scriptsQueue_) {
            void script.evaluate();
        }
        scriptsQueue.set([]);
    }
}

function pyscript_get_config() {
    return globalApp.config;
}
globalExport('pyscript_get_config', pyscript_get_config);

// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();
