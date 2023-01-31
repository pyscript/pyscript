import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig } from './pyconfig';
import type { Interpreter } from './interpreter';
import { version } from './version';
import { PluginManager, define_custom_element } from './plugin';
import { make_PyScript, initHandlers, mountElements } from './components/pyscript';
import { PyodideInterpreter } from './pyodide';
import { getLogger } from './logger';
import { showWarning, globalExport } from './utils';
import { calculatePaths } from './plugins/fetch';
import { createCustomElements } from './components/elements';
import { UserError, ErrorCode, _createAlertBanner } from './exceptions';
import { type Stdio, StdioMultiplexer, DEFAULT_STDIO } from './stdio';
import { PyTerminalPlugin } from './plugins/pyterminal';
import { SplashscreenPlugin } from './plugins/splashscreen';
import { ImportmapPlugin } from './plugins/importmap';
import { StdioDirector as StdioDirector } from './plugins/stdiodirector';
// eslint-disable-next-line
// @ts-ignore
import pyscript from './python/pyscript.py';
import { robustFetch } from './fetch';
import type { Plugin } from './plugin';

const logger = getLogger('pyscript/main');

/* High-level overview of the lifecycle of a PyScript App:

   1. pyscript.js is loaded by the browser. PyScriptApp().main() is called

   2. loadConfig(): search for py-config and compute the config for the app

   3. (it used to be "show the splashscreen", but now it's a plugin)

   4. loadInterpreter(): start downloading the actual interpreter (e.g. pyodide.js)

   --- wait until (4) has finished ---

   5. now the pyodide src is available. Initialize the engine

   6. setup the environment, install packages

   6.5: call the Plugin.afterSetup() hook

   7. connect the py-script web component. This causes the execution of all the
      user scripts

   8. initialize the rest of web components such as py-button, py-repl, etc.

More concretely:

  - Points 1-4 are implemented sequentially in PyScriptApp.main().

  - PyScriptApp.loadInterpreter adds a <script> tag to the document to initiate
    the download, and then adds an event listener for the 'load' event, which
    in turns calls PyScriptApp.afterInterpreterLoad().

  - PyScriptApp.afterInterpreterLoad() implements all the points >= 5.
*/

export class PyScriptApp {
    config: AppConfig;
    interpreter: Interpreter;
    PyScript: ReturnType<typeof make_PyScript>;
    plugins: PluginManager;
    _stdioMultiplexer: StdioMultiplexer;

    constructor() {
        // initialize the builtin plugins
        this.plugins = new PluginManager();
        this.plugins.add(new SplashscreenPlugin(), new PyTerminalPlugin(this), new ImportmapPlugin());

        this._stdioMultiplexer = new StdioMultiplexer();
        this._stdioMultiplexer.addListener(DEFAULT_STDIO);

        this.plugins.add(new StdioDirector(this._stdioMultiplexer));
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
        this.loadInterpreter();
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
    loadInterpreter() {
        logger.info('Initializing interpreter');
        if (this.config.interpreters.length == 0) {
            throw new UserError(ErrorCode.BAD_CONFIG, 'Fatal error: config.interpreter is empty');
        }

        if (this.config.interpreters.length > 1) {
            showWarning('Multiple interpreters are not supported yet.<br />Only the first will be used', 'html');
        }

        const interpreter_cfg = this.config.interpreters[0];
        this.interpreter = new PyodideInterpreter(
            this.config,
            this._stdioMultiplexer,
            interpreter_cfg.src,
            interpreter_cfg.name,
            interpreter_cfg.lang,
        );
        this.logStatus(`Downloading ${interpreter_cfg.name}...`);

        // download pyodide by using a <script> tag. Once it's ready, the
        // "load" event will be fired and the exeuction logic will continue.
        // Note that the load event is fired asynchronously and thus any
        // exception which is throw inside the event handler is *NOT* caught
        // by the try/catch inside main(): that's why we need to .catch() it
        // explicitly and call _handleUserErrorMaybe also there.
        const script = document.createElement('script'); // create a script DOM node
        script.src = this.interpreter.src;
        script.addEventListener('load', () => {
            this.afterInterpreterLoad(this.interpreter).catch(error => {
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
    async afterInterpreterLoad(interpreter: Interpreter): Promise<void> {
        console.assert(this.config !== undefined);

        this.logStatus('Python startup...');
        await this.interpreter.loadInterpreter();
        this.logStatus('Python ready!');

        this.logStatus('Setting up virtual environment...');
        await this.setupVirtualEnv(interpreter);
        mountElements(interpreter);

        // lifecycle (6.5)
        this.plugins.afterSetup(interpreter);

        //Refresh module cache in case plugins have modified the filesystem
        interpreter.invalidate_module_path_cache();
        this.logStatus('Executing <py-script> tags...');
        this.executeScripts(interpreter);

        this.logStatus('Initializing web components...');
        // lifecycle (8)
        createCustomElements(interpreter);

        initHandlers(interpreter);

        // NOTE: interpreter message is used by integration tests to know that
        // pyscript initialization has complete. If you change it, you need to
        // change it also in tests/integration/support.py
        this.logStatus('Startup complete');
        this.plugins.afterStartup(interpreter);
        logger.info('PyScript page fully initialized');
    }

    // lifecycle (6)
    async setupVirtualEnv(interpreter: Interpreter): Promise<void> {
        // XXX: maybe the following calls could be parallelized, instead of
        // await()ing immediately. For now I'm using await to be 100%
        // compatible with the old behavior.
        logger.info('importing pyscript');

        // Save and load pyscript.py from FS
        interpreter.interface.FS.writeFile('pyscript.py', pyscript, { encoding: 'utf8' });
        //Refresh the module cache so Python consistently finds pyscript module
        interpreter.invalidate_module_path_cache();

        // inject `define_custom_element` and showWarning it into the PyScript
        // module scope
        const pyscript_module = interpreter.interface.pyimport('pyscript');
        pyscript_module.define_custom_element = define_custom_element;
        pyscript_module.showWarning = showWarning;
        pyscript_module._set_version_info(version);
        pyscript_module.destroy();

        // import some carefully selected names into the global namespace
        await interpreter.run(`
        import js
        import pyscript
        from pyscript import Element, display, HTML
        pyscript._install_deprecated_globals_2022_12_1(globals())
        `);

        if (this.config.packages) {
            logger.info('Packages to install: ', this.config.packages);
            await interpreter.installPackage(this.config.packages);
        }
        await this.fetchPaths(interpreter);

        //This may be unnecessary - only useful if plugins try to import files fetch'd in fetchPaths()
        interpreter.invalidate_module_path_cache();
        // Finally load plugins
        await this.fetchUserPlugins(interpreter);
    }

    async fetchPaths(interpreter: Interpreter) {
        // XXX this can be VASTLY improved: for each path we need to fetch a
        // URL and write to the virtual filesystem: pyodide.loadFromFile does
        // it in Python, which means we need to have the interpreter
        // initialized. But we could easily do it in JS in parallel with the
        // download/startup of pyodide.
        const [paths, fetchPaths] = calculatePaths(this.config.fetch);
        logger.info('Paths to fetch: ', fetchPaths);
        for (let i = 0; i < paths.length; i++) {
            logger.info(`  fetching path: ${fetchPaths[i]}`);

            // Exceptions raised from here will create an alert banner
            await interpreter.loadFromFile(paths[i], fetchPaths[i]);
        }
        logger.info('All paths fetched');
    }

    /**
     * Fetch user plugins and adds them to `this.plugins` so they can
     * be loaded by the PluginManager. Currently, we are just looking
     * for .py and .js files and calling the appropriate methods.
     *
     * @param interpreter - the interpreter that will be used to execute the plugins that need it.
     */
    async fetchUserPlugins(interpreter: Interpreter) {
        const plugins = this.config.plugins;
        logger.info('Plugins to fetch: ', plugins);
        for (const singleFile of plugins) {
            logger.info(`  fetching plugins: ${singleFile}`);
            if (singleFile.endsWith('.py')) {
                await this.fetchPythonPlugin(interpreter, singleFile);
            } else if (singleFile.endsWith('.js')) {
                await this.fetchJSPlugin(singleFile);
            } else {
                throw new UserError(
                    ErrorCode.BAD_PLUGIN_FILE_EXTENSION,
                    `Unable to load plugin from '${singleFile}'. ` +
                        `Plugins need to contain a file extension and be ` +
                        `either a python or javascript file.`,
                );
            }
            logger.info('All plugins fetched');
        }
    }

    /**
     * Fetch a javascript plugin from a filePath, it gets a blob from the
     * fetch and creates a file from it, then we create a URL from the file
     * so we can import it as a module.
     *
     * This allow us to instantiate the imported plugin with the default
     * export in the module (the plugin class) and add it to the plugins
     * list with `new importedPlugin()`.
     *
     * @param filePath - URL of the javascript file to fetch.
     */
    async fetchJSPlugin(filePath: string) {
        const pluginBlob = await (await robustFetch(filePath)).blob();
        const blobFile = new File([pluginBlob], 'plugin.js', { type: 'text/javascript' });
        const fileUrl = URL.createObjectURL(blobFile);

        const module = await import(fileUrl);
        // Note: We have to put module.default in a variable
        // because we have seen weird behaviour when doing
        // new module.default() directly.
        const importedPlugin = module.default;

        // If the imported plugin doesn't have a default export
        // it will be undefined, so we throw a user error, so
        // an alter banner will be created.
        if (importedPlugin === undefined) {
            throw new UserError(
                ErrorCode.NO_DEFAULT_EXPORT,
                `Unable to load plugin from '${filePath}'. ` + `Plugins need to contain a default export.`,
            );
        } else {
            this.plugins.add(new importedPlugin());
        }
    }

    /**
     * Fetch python plugins from a filePath, saves it on the FS and import
     * it as a module, executing any plugin define the module scope.
     *
     * @param interpreter - the interpreter that will execute the plugins
     * @param filePath - path to the python file to fetch
     */
    async fetchPythonPlugin(interpreter: Interpreter, filePath: string) {
        const pathArr = filePath.split('/');
        const filename = pathArr.pop();
        // TODO: Would be probably be better to store plugins somewhere like /plugins/python/ or similar
        const destPath = `./${filename}`;
        await interpreter.loadFromFile(destPath, filePath);

        //refresh module cache before trying to import module files into interpreter
        interpreter.invalidate_module_path_cache();

        const modulename = filePath.replace(/^.*[\\/]/, '').replace('.py', '');

        console.log(`importing ${modulename}`);
        // TODO: This is very specific to Pyodide API and will not work for other interpreters,
        //       when we add support for other interpreters we will need to move this to the
        //       interpreter API level and allow each one to implement it in its own way
        const module = interpreter.interface.pyimport(modulename);
        if (typeof module.plugin !== 'undefined') {
            const py_plugin = module.plugin;
            py_plugin.init(this);
            this.plugins.addPythonPlugin(py_plugin);
        } else {
            logger.error(`Cannot find plugin on Python module ${modulename}! Python plugins \
modules must contain a "plugin" attribute. For more information check the plugins documentation.`);
        }
    }

    // lifecycle (7)
    executeScripts(interpreter: Interpreter) {
        // make_PyScript takes an interpreter and a PyScriptApp as arguments
        this.PyScript = make_PyScript(interpreter, this);
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
export const interpreter = globalApp.interpreter;
// TODO: This is for backwards compatibility, it should be removed
// when we finish the deprecation cycle of `runtime`
export const runtime = globalApp.interpreter;
