import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import { version } from './runtime';
import { PluginManager, define_custom_element } from './plugin';
import { make_PyScript, initHandlers, mountElements } from './components/pyscript';
import { PyodideRuntime } from './pyodide';
import { getLogger } from './logger';
import { handleFetchError, showWarning, globalExport } from './utils';
import { calculatePaths } from './plugins/fetch';
import { createCustomElements } from './components/elements';
import { UserError, ErrorCode, _createAlertBanner } from "./exceptions"
import { type Stdio, StdioMultiplexer, DEFAULT_STDIO } from './stdio';
import { PyTerminalPlugin } from './plugins/pyterminal';
import { SplashscreenPlugin } from './plugins/splashscreen';
import { ImportmapPlugin } from './plugins/importmap';
// eslint-disable-next-line
// @ts-ignore
import pyscript from './python/pyscript.py';

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
    PyScript: ReturnType<typeof make_PyScript>;
    plugins: PluginManager;
    _stdioMultiplexer: StdioMultiplexer;

    constructor() {
        // initialize the builtin plugins
        this.plugins = new PluginManager();
        this.plugins.add(new SplashscreenPlugin(), new PyTerminalPlugin(this), new ImportmapPlugin());

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
        } catch (error) {
            this._handleUserErrorMaybe(error);
        }
    }

    _handleUserErrorMaybe(error) {
        if (error instanceof UserError) {
            _createAlertBanner(error.message, 'error', error.messageType);
            this.plugins.onUserError(error);
        } else {
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
                'Multiple <py-config> tags detected. Only the first is ' +
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
            throw new UserError(ErrorCode.BAD_CONFIG, 'Fatal error: config.runtimes is empty');
        }

        if (this.config.runtimes.length > 1) {
            showWarning('Multiple runtimes are not supported yet.<br />Only the first will be used', 'html');
        }
        const runtime_cfg = this.config.runtimes[0];
        this.runtime = new PyodideRuntime(
            this.config,
            this._stdioMultiplexer,
            runtime_cfg.src,
            runtime_cfg.name,
            runtime_cfg.lang,
        );
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
            this.afterRuntimeLoad(this.runtime).catch(error => {
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
        mountElements(runtime);

        // lifecycle (6.5)
        this.plugins.afterSetup(runtime);

        //Refresh module cache in case plugins have modified the filesystem
        runtime.invalidate_module_path_cache()
        this.logStatus('Executing <py-script> tags...');
        this.executeScripts(runtime);

        this.logStatus('Initializing web components...');
        // lifecycle (8)
        createCustomElements(runtime);

        initHandlers(runtime);

        // NOTE: runtime message is used by integration tests to know that
        // pyscript initialization has complete. If you change it, you need to
        // change it also in tests/integration/support.py
        this.logStatus('Startup complete');
        this.plugins.afterStartup(runtime);
        logger.info('PyScript page fully initialized');
    }

    // lifecycle (6)
    async setupVirtualEnv(runtime: Runtime): Promise<void> {
        // XXX: maybe the following calls could be parallelized, instead of
        // await()ing immediately. For now I'm using await to be 100%
        // compatible with the old behavior.
        logger.info('importing pyscript');

        // Save and load pyscript.py from FS
        runtime.interpreter.FS.writeFile('pyscript.py', pyscript, { encoding: 'utf8' });
        //Refresh the module cache so Python consistently finds pyscript module
        runtime.invalidate_module_path_cache()

        // inject `define_custom_element` it into the PyScript module scope
        const pyscript_module = runtime.interpreter.pyimport('pyscript');
        pyscript_module.define_custom_element = define_custom_element;
        pyscript_module.PyScript.set_version_info(version);
        pyscript_module.destroy();

        // TODO: Currently adding the imports for backwards compatibility, we should
        //       remove it
        await runtime.run(`
        from pyscript import *
        `);
        logger.warn(`DEPRECATION WARNING: 'micropip', 'Element', 'console', 'document' and several other \
objects form the pyscript module (with the exception of 'display') will be \
be removed from the Python global namespace in the following release. \
To avoid errors in future releases use import from pyscript instead. For instance: \
from pyscript import micropip, Element, console, document`);

        logger.info('Packages to install: ', this.config.packages);
        await runtime.installPackage(this.config.packages);
        await this.fetchPaths(runtime);

        //This may be unnecessary - only useful if plugins try to import files fetch'd in fetchPaths()
        runtime.invalidate_module_path_cache()
        // Finally load plugins
        await this.fetchPythonPlugins(runtime);
    }

    async fetchPaths(runtime: Runtime) {
        // XXX this can be VASTLY improved: for each path we need to fetch a
        // URL and write to the virtual filesystem: pyodide.loadFromFile does
        // it in Python, which means we need to have the runtime
        // initialized. But we could easily do it in JS in parallel with the
        // download/startup of pyodide.
        const [paths, fetchPaths] = calculatePaths(this.config.fetch);
        logger.info('Paths to fetch: ', fetchPaths);
        for (let i = 0; i < paths.length; i++) {
            logger.info(`  fetching path: ${fetchPaths[i]}`);
            try {
                await runtime.loadFromFile(paths[i], fetchPaths[i]);
            } catch (e) {
                // The 'TypeError' here happens when running pytest
                // I'm not particularly happy with this solution.
                if (e.name === 'FetchError' || e.name === 'TypeError') {
                    handleFetchError(<Error>e, fetchPaths[i]);
                } else {
                    throw e;
                }
            }
        }
        logger.info('All paths fetched');
    }

    /**
     * Fetches all the python plugins specified in this.config, saves them on the FS and import
     * them as modules, executing any plugin define the module scope
     *
     * @param runtime - runtime that will execute the plugins
     */
    async fetchPythonPlugins(runtime: Runtime) {
        const plugins = this.config.plugins;
        logger.info('Python plugins to fetch: ', plugins);
        for (const singleFile of plugins) {
            logger.info(`  fetching plugins: ${singleFile}`);
            try {
                const pathArr = singleFile.split('/');
                const filename = pathArr.pop();
                // TODO: Would be probably be better to store plugins somewhere like /plugins/python/ or similar
                const destPath = `./${filename}`;
                await runtime.loadFromFile(destPath, singleFile);

                //refresh module cache before trying to import module files into runtime
                runtime.invalidate_module_path_cache()

                const modulename = singleFile.replace(/^.*[\\/]/, '').replace('.py', '');

                console.log(`importing ${modulename}`);
                // TODO: This is very specific to Pyodide API and will not work for other interpreters,
                //       when we add support for other interpreters we will need to move this to the
                //       runtime (interpreter) API level and allow each one to implement it in its own way
                const module = runtime.interpreter.pyimport(modulename);
                if (typeof module.plugin !== 'undefined') {
                    const py_plugin = module.plugin;
                    py_plugin.init(this);
                    this.plugins.addPythonPlugin(py_plugin);
                } else {
                    logger.error(`Cannot find plugin on Python module ${modulename}! Python plugins \
modules must contain a "plugin" attribute. For more information check the plugins documentation.`);
                }
            } catch (e) {
                //Should we still export full error contents to console?
                handleFetchError(<Error>e, singleFile);
            }
        }
        logger.info('All plugins fetched');
    }

    // lifecycle (7)
    executeScripts(runtime: Runtime) {
        this.PyScript = make_PyScript(runtime);
        customElements.define('py-script', this.PyScript);
    }

    // ================= registraton API ====================

    logStatus(msg: string) {
        logger.info(msg);
        const ev = new CustomEvent('py-status-message', { detail: msg });
        document.dispatchEvent(ev);
    }

    registerStdioListener(stdio: Stdio) {
        this._stdioMultiplexer.addListener(stdio);
    }
}

function pyscript_get_config() {
    return globalApp.config;
}
globalExport('pyscript_get_config', pyscript_get_config);

// main entry point of execution
const globalApp = new PyScriptApp();
globalApp.main();

export { version };
export const runtime = globalApp.runtime;
