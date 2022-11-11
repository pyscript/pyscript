import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import { type Plugin, PluginManager } from './plugin';
import { make_PyScript, initHandlers, mountElements } from './components/pyscript';
import { PyodideRuntime } from './pyodide';
import { getLogger } from './logger';
import { handleFetchError, showWarning, globalExport } from './utils';
import { calculatePaths } from './plugins/fetch';
import { createCustomElements } from './components/elements';
import { UserError, _createAlertBanner } from "./exceptions"
import { type Stdio, StdioMultiplexer, DEFAULT_STDIO } from './stdio';
import { PyTerminalPlugin } from './plugins/pyterminal';
import { SplashscreenPlugin } from './plugins/splashscreen';

type ImportType = { [key: string]: unknown };
type ImportMapType = {
    imports: ImportType | null;
};

const logger = getLogger('pyscript/main');

/* High-level overview of the lifecycle of a PyScript App:

   1. pyscript.js is loaded by the browser. PyScriptApp().main() is called

   2. loadConfig(): search for py-config and compute the config for the app

   3. (it used to be "show the splashscreen", but now it's a plugin)

   4. loadRuntime(): start downloading the actual runtime (e.g. pyodide.js)

   --- wait until (4) has finished ---

   5. now the pyodide src is available. Initialize the engine

   6. setup the environment, install packages

   6.5: call the Plugin.afterSetup() hook

   7. connect the py-script web component. This causes the execution of all the
      user scripts

   8. initialize the rest of web components such as py-button, py-repl, etc.

More concretely:

  - Points 1-4 are implemented sequentially in PyScriptApp.main().

  - PyScriptApp.loadRuntime adds a <script> tag to the document to initiate
    the download, and then adds an event listener for the 'load' event, which
    in turns calls PyScriptApp.afterRuntimeLoad().

  - PyScriptApp.afterRuntimeLoad() implements all the points >= 5.
*/



export class PyScriptApp {
    config: AppConfig;
    runtime: Runtime;
    PyScript: any; // XXX would be nice to have a more precise type for the class itself
    plugins: PluginManager;
    _stdioMultiplexer: StdioMultiplexer;

    constructor() {
        // initialize the builtin plugins
        this.plugins = new PluginManager();
        this.plugins.add(
            new SplashscreenPlugin(),
            new PyTerminalPlugin(this),
        );

        this._stdioMultiplexer = new StdioMultiplexer();
        this._stdioMultiplexer.addListener(DEFAULT_STDIO);
    }

    // Error handling logic: if during the execution we encounter an error
    // which is ultimate responsibility of the user (e.g.: syntax error in the
    // config, file not found in fetch, etc.), we can throw UserError(). It is
    // responsibility of main() to catch it and show it to the user in a
    // proper way (e.g. by using a banner at the top of the page).
    main() {
        try {
            this._realMain();
        }
        catch(error) {
            this._handleUserErrorMaybe(error);
        }
    }

    _handleUserErrorMaybe(error) {
        if (error instanceof UserError) {
            _createAlertBanner(error.message);
            this.plugins.onUserError(error);
        }
        else {
            throw error;
        }
    }

    // ============ lifecycle ============

    // lifecycle (1)
    _realMain() {
        this.loadConfig();
        this.plugins.configure(this.config);
        this.plugins.beforeLaunch(this.config);
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
        let el: Element | null = null;
        if (elements.length > 0) el = elements[0];
        if (elements.length >= 2) {
            showWarning(
                'Multiple &lt;py-config&gt; tags detected. Only the first is ' +
                'going to be parsed, all the others will be ignored',
            );
        }
        this.config = loadConfigFromElement(el);
        logger.info('config loaded:\n' + JSON.stringify(this.config, null, 2));
    }

    // lifecycle (4)
    loadRuntime() {
        logger.info('Initializing runtime');
        if (this.config.runtimes.length == 0) {
            throw new UserError('Fatal error: config.runtimes is empty');
        }

        if (this.config.runtimes.length > 1) {
            showWarning('Multiple runtimes are not supported yet.<br />Only the first will be used');
        }
        const runtime_cfg = this.config.runtimes[0];
        this.runtime = new PyodideRuntime(this.config,
                                          this._stdioMultiplexer,
                                          runtime_cfg.src,
                                          runtime_cfg.name,
                                          runtime_cfg.lang);
        this.logStatus(`Downloading ${runtime_cfg.name}...`);

        // download pyodide by using a <script> tag. Once it's ready, the
        // "load" event will be fired and the exeuction logic will continue.
        // Note that the load event is fired asynchronously and thus any
        // exception which is throw inside the event handler is *NOT* caught
        // by the try/catch inside main(): that's why we need to .catch() it
        // explicitly and call _handleUserErrorMaybe also there.
        const script = document.createElement('script'); // create a script DOM node
        script.src = this.runtime.src;
        script.addEventListener('load', () => {
            this.afterRuntimeLoad(this.runtime).catch((error) => {
                this._handleUserErrorMaybe(error);
            });
        });
        document.head.appendChild(script);
    }

    // lifecycle (5)
    // See the overview comment above for an explanation of how we jump from
    // point (4) to point (5).
    //
    // Invariant: this.config is set and available.
    async afterRuntimeLoad(runtime: Runtime): Promise<void> {
        console.assert(this.config !== undefined);

        this.logStatus('Python startup...');
        await runtime.loadInterpreter();
        this.logStatus('Python ready!');

        this.logStatus('Setting up virtual environment...');
        await this.setupVirtualEnv(runtime);
        await mountElements(runtime);

        // lifecycle (6.5)
        this.plugins.afterSetup(runtime);

        this.logStatus('Executing <py-script> tags...');
        this.executeScripts(runtime);

        this.logStatus('Initializing web components...');
        // lifecycle (8)
        createCustomElements(runtime);

        await initHandlers(runtime);

        // NOTE: runtime message is used by integration tests to know that
        // pyscript initialization has complete. If you change it, you need to
        // change it also in tests/integration/support.py
        this.plugins.afterStartup(runtime);
        logger.info('PyScript page fully initialized');
    }

    // lifecycle (6)
    async setupVirtualEnv(runtime: Runtime): Promise<void> {
        // XXX: maybe the following calls could be parallelized, instead of
        // await()ing immediately. For now I'm using await to be 100%
        // compatible with the old behavior.
        logger.info('Packages to install: ', this.config.packages);
        await runtime.installPackage(this.config.packages);
        await this.fetchPaths(runtime);
    }

    async fetchPaths(runtime: Runtime) {
        // XXX this can be VASTLY improved: for each path we need to fetch a
        // URL and write to the virtual filesystem: pyodide.loadFromFile does
        // it in Python, which means we need to have the runtime
        // initialized. But we could easily do it in JS in parallel with the
        // download/startup of pyodide.
        const [paths, fetchPaths] = calculatePaths(this.config.fetch);
        logger.info('Paths to fetch: ', fetchPaths);
        for (let i=0; i<paths.length; i++) {
            logger.info(`  fetching path: ${fetchPaths[i]}`);
            try {
                await runtime.loadFromFile(paths[i], fetchPaths[i]);
            } catch (e) {
                // The 'TypeError' here happens when running pytest
                // I'm not particularly happy with this solution.
                if (e.name === "FetchError" || e.name === "TypeError") {
                    handleFetchError(<Error>e, fetchPaths[i]);
                } else {
                    throw e
                }
            }
        }
        logger.info('All paths fetched');
    }

    // lifecycle (7)
    executeScripts(runtime: Runtime) {
        void this.register_importmap(runtime);
        this.PyScript = make_PyScript(runtime);
        customElements.define('py-script', this.PyScript);
    }

    // ================= registraton API ====================

    logStatus(msg: string) {
        logger.info(msg);
        const ev = new CustomEvent("py-status-message", { detail: msg });
        document.dispatchEvent(ev);
    }

    registerStdioListener(stdio: Stdio) {
        this._stdioMultiplexer.addListener(stdio);
    }

    async register_importmap(runtime: Runtime) {
        // make importmap ES modules available from python using 'import'.
        //
        // XXX: this code can probably be improved because errors are silently
        // ignored. Moreover at the time of writing we don't really have a test
        // for it and this functionality is used only by the d3 example. We
        // might want to rethink the whole approach at some point. E.g., maybe
        // we should move it to py-config?
        //
        // Moreover, it's also wrong because it's async and currently we don't
        // await the module to be fully registered before executing the code
        // inside py-script. It's also unclear whether we want to wait or not
        // (or maybe only wait only if we do an actual 'import'?)
        for (const node of document.querySelectorAll("script[type='importmap']")) {
            const importmap: ImportMapType = (() => {
                try {
                    return JSON.parse(node.textContent) as ImportMapType;
                } catch {
                    return null;
                }
            })();

            if (importmap?.imports == null) continue;

            for (const [name, url] of Object.entries(importmap.imports)) {
                if (typeof name != 'string' || typeof url != 'string') continue;

                let exports: object;
                try {
                    // XXX: pyodide doesn't like Module(), failing with
                    // "can't read 'name' of undefined" at import time
                    exports = { ...(await import(url)) } as object;
                } catch {
                    logger.warn(`failed to fetch '${url}' for '${name}'`);
                    continue;
                }

                runtime.registerJsModule(name, exports);
            }
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

export const runtime = globalApp.runtime;
