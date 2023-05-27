import { $$ } from 'basic-devtools';

import './styles/pyscript_base.css';

import { loadConfigFromElement } from './pyconfig';
import type { AppConfig, InterpreterConfig } from './pyconfig';
import { InterpreterClient } from './interpreter_client';
import { PluginManager, Plugin, PythonPlugin } from './plugin';
import { make_PyScript, initHandlers, mountElements } from './components/pyscript';
import { getLogger } from './logger';
import { showWarning, createLock } from './utils';
import { calculateFetchPaths } from './plugins/calculateFetchPaths';
import { createCustomElements } from './components/elements';
import { UserError, ErrorCode, _createAlertBanner } from './exceptions';
import { type Stdio, StdioMultiplexer, DEFAULT_STDIO } from './stdio';
import { PyTerminalPlugin } from './plugins/pyterminal';
import { SplashscreenPlugin } from './plugins/splashscreen';
import { ImportmapPlugin } from './plugins/importmap';
import { StdioDirector as StdioDirector } from './plugins/stdiodirector';
import { RemoteInterpreter } from './remote_interpreter';
import { robustFetch } from './fetch';
import * as Synclink from 'synclink';

const logger = getLogger('pyscript/main');

/**
 * Monkey patching the error transfer handler to preserve the `$$isUserError`
 * marker so as to detect `UserError` subclasses in the error handling code.
 */
const throwHandler = Synclink.transferHandlers.get('throw') as Synclink.TransferHandler<
    { value: unknown },
    { value: { $$isUserError: boolean } }
>;
const old_error_transfer_handler = throwHandler.serialize.bind(throwHandler) as typeof throwHandler.serialize;
function new_error_transfer_handler({ value }: { value: { $$isUserError: boolean } }) {
    const result = old_error_transfer_handler({ value });
    result[0].value.$$isUserError = value.$$isUserError;
    return result;
}
throwHandler.serialize = new_error_transfer_handler;

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
*/

export let interpreter;
// TODO: This is for backwards compatibility, it should be removed
// when we finish the deprecation cycle of `runtime`
export let runtime;

export class PyScriptApp {
    config: AppConfig;
    interpreter: InterpreterClient;
    readyPromise: Promise<void>;
    PyScript: ReturnType<typeof make_PyScript>;
    plugins: PluginManager;
    _stdioMultiplexer: StdioMultiplexer;
    tagExecutionLock: () => Promise<() => void>; // this is used to ensure that py-script tags are executed sequentially
    _numPendingTags: number;
    scriptTagsPromise: Promise<void>;
    resolvedScriptTags: () => void;

    constructor() {
        // initialize the builtin plugins
        this.plugins = new PluginManager();
        this.plugins.add(new SplashscreenPlugin(), new PyTerminalPlugin(this), new ImportmapPlugin());

        this._stdioMultiplexer = new StdioMultiplexer();
        this._stdioMultiplexer.addListener(DEFAULT_STDIO);

        this.plugins.add(new StdioDirector(this._stdioMultiplexer));
        this.tagExecutionLock = createLock();
        this._numPendingTags = 0;
        this.scriptTagsPromise = new Promise(res => (this.resolvedScriptTags = res));
    }

    // Error handling logic: if during the execution we encounter an error
    // which is ultimate responsibility of the user (e.g.: syntax error in the
    // config, file not found in fetch, etc.), we can throw UserError(). It is
    // responsibility of main() to catch it and show it to the user in a
    // proper way (e.g. by using a banner at the top of the page).
    async main() {
        try {
            await this._realMain();
        } catch (error) {
            await this._handleUserErrorMaybe(error);
        }
    }

    incrementPendingTags() {
        this._numPendingTags += 1;
    }

    decrementPendingTags() {
        if (this._numPendingTags <= 0) {
            throw new Error('INTERNAL ERROR: assertion _numPendingTags > 0 failed');
        }
        this._numPendingTags -= 1;
        if (this._numPendingTags === 0) {
            this.resolvedScriptTags();
        }
    }

    async _handleUserErrorMaybe(error: any) {
        const e = error as UserError;
        if (e && e.$$isUserError) {
            _createAlertBanner(e.message, 'error', e.messageType);
            await this.plugins.onUserError(e);
        } else {
            throw error;
        }
    }

    // ============ lifecycle ============

    // lifecycle (1)
    async _realMain() {
        this.loadConfig();
        await this.plugins.configure(this.config);
        this.plugins.beforeLaunch(this.config);
        await this.loadInterpreter();
        interpreter = this.interpreter;
        // TODO: This is for backwards compatibility, it should be removed
        // when we finish the deprecation cycle of `runtime`
        runtime = this.interpreter;
    }

    // lifecycle (2)
    loadConfig() {
        // find the <py-config> tag. If not found, we get null which means
        // "use the default config"
        // XXX: we should actively complain if there are multiple <py-config>
        // and show a big error. PRs welcome :)
        logger.info('searching for <py-config>');
        const elements = $$('py-config', document);
        let el: Element | null = null;
        if (elements.length > 0) el = elements[0];
        if (elements.length >= 2) {
            showWarning(
                'Multiple <py-config> tags detected. Only the first is ' +
                    'going to be parsed, all the others will be ignored',
            );
        }
        this.config = loadConfigFromElement(el);
        if (this.config.execution_thread === 'worker' && crossOriginIsolated === false) {
            throw new UserError(
                ErrorCode.BAD_CONFIG,
                `When execution_thread is "worker", the site must be cross origin isolated, but crossOriginIsolated is false.
                To be cross origin isolated, the server must use https and also serve with the following headers: ${JSON.stringify(
                    {
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin',
                    },
                )}.

                The problem may be that one or both of these are missing.
                `,
            );
        }
        logger.info('config loaded:\n' + JSON.stringify(this.config, null, 2));
    }

    _get_base_url(): string {
        // Note that this requires that pyscript is loaded via a <script>
        // tag. If we want to allow loading via an ES6 module in the future,
        // we need to think about some other strategy
        const elem = document.currentScript as HTMLScriptElement;
        const slash = elem.src.lastIndexOf('/');
        return elem.src.slice(0, slash);
    }

    async _startInterpreter_main(interpreter_cfg: InterpreterConfig) {
        logger.info('Starting the interpreter in the main thread');
        // this is basically equivalent to worker_initialize()
        const remote_interpreter = new RemoteInterpreter(interpreter_cfg.src);
        const { port1, port2 } = new Synclink.FakeMessageChannel() as unknown as MessageChannel;
        port1.start();
        port2.start();
        Synclink.expose(remote_interpreter, port2);
        const wrapped_remote_interpreter = Synclink.wrap(port1);

        this.logStatus(`Downloading ${interpreter_cfg.name}...`);
        /* Dynamically download and import pyodide: the import() puts a
           loadPyodide() function into globalThis, which is later called by
           RemoteInterpreter.

           This is suboptimal: ideally, we would like to import() a module
           which exports loadPyodide(), but this plays badly with workers
           because at the moment of writing (2023-03-24) Firefox does not
           support ES modules in workers:
           https://caniuse.com/mdn-api_worker_worker_ecmascript_modules
        */
        const interpreterURL = interpreter_cfg.src;
        await import(interpreterURL);
        return wrapped_remote_interpreter;
    }

    async _startInterpreter_worker(interpreter_cfg: InterpreterConfig) {
        logger.warn('execution_thread = "worker" is still VERY experimental, use it at your own risk');
        logger.info('Starting the interpreter in a web worker');
        const base_url = this._get_base_url();
        const worker = new Worker(base_url + '/interpreter_worker.js');
        const worker_initialize: any = Synclink.wrap(worker);
        const wrapped_remote_interpreter = await worker_initialize(interpreter_cfg);
        return wrapped_remote_interpreter;
    }

    // lifecycle (4)
    async loadInterpreter() {
        logger.info('Initializing interpreter');
        if (this.config.interpreters.length == 0) {
            throw new UserError(ErrorCode.BAD_CONFIG, 'Fatal error: config.interpreter is empty');
        }

        if (this.config.interpreters.length > 1) {
            showWarning('Multiple interpreters are not supported yet.<br />Only the first will be used', 'html');
        }

        const cfg = this.config.interpreters[0];
        let wrapped_remote_interpreter;
        if (this.config.execution_thread == 'worker') {
            wrapped_remote_interpreter = await this._startInterpreter_worker(cfg);
        } else {
            wrapped_remote_interpreter = await this._startInterpreter_main(cfg);
        }

        this.interpreter = new InterpreterClient(
            this.config,
            this._stdioMultiplexer,
            wrapped_remote_interpreter as Synclink.Remote<RemoteInterpreter>,
        );
        await this.afterInterpreterLoad(this.interpreter);
    }

    // lifecycle (5)
    // See the overview comment above for an explanation of how we jump from
    // point (4) to point (5).
    //
    // Invariant: this.config is set and available.
    async afterInterpreterLoad(interpreter: InterpreterClient): Promise<void> {
        console.assert(this.config !== undefined);

        this.logStatus('Python startup...');
        await this.interpreter.initializeRemote();
        this.logStatus('Python ready!');

        this.logStatus('Setting up virtual environment...');
        await this.setupVirtualEnv(interpreter);
        await mountElements(interpreter);

        // lifecycle (6.5)
        await this.plugins.afterSetup(interpreter);

        //Refresh module cache in case plugins have modified the filesystem
        await interpreter._remote.invalidate_module_path_cache();
        this.logStatus('Executing <py-script> tags...');
        await this.executeScripts(interpreter);

        this.logStatus('Initializing web components...');
        // lifecycle (8)

        //Takes a runtime and a reference to the PyScriptApp (to access plugins)
        createCustomElements(interpreter, this);
        initHandlers(interpreter);

        // NOTE: interpreter message is used by integration tests to know that
        // pyscript initialization has complete. If you change it, you need to
        // change it also in tests/integration/support.py
        this.logStatus('Startup complete');
        await this.plugins.afterStartup(interpreter);
        logger.info('PyScript page fully initialized');
    }

    // lifecycle (6)
    async setupVirtualEnv(interpreter: InterpreterClient): Promise<void> {
        // XXX: maybe the following calls could be parallelized, instead of
        // await()ing immediately. For now I'm using await to be 100%
        // compatible with the old behavior.
        await Promise.all([this.installPackages(), this.fetchPaths(interpreter)]);

        //This may be unnecessary - only useful if plugins try to import files fetch'd in fetchPaths()
        await interpreter._remote.invalidate_module_path_cache();
        // Finally load plugins
        await this.fetchUserPlugins(interpreter);
    }

    async installPackages() {
        if (!this.config.packages) {
            return;
        }
        logger.info('Packages to install: ', this.config.packages);
        await this.interpreter._remote.installPackage(this.config.packages);
    }

    async fetchPaths(interpreter: InterpreterClient) {
        // TODO: start fetching before interpreter initialization
        const paths = calculateFetchPaths(this.config.fetch);
        logger.info('Fetching urls:', paths.map(({ url }) => url).join(', '));
        await Promise.all(
            paths.map(async ({ path, url }) => {
                await interpreter._remote.loadFileFromURL(path, url);
                logger.info(`    Fetched ${url} ==> ${path}`);
            }),
        );
        logger.info('Fetched all paths');
    }

    /**
     * Fetch user plugins and adds them to `this.plugins` so they can
     * be loaded by the PluginManager. Currently, we are just looking
     * for .py and .js files and calling the appropriate methods.
     *
     * @param interpreter - the interpreter that will be used to execute the plugins that need it.
     */
    async fetchUserPlugins(interpreter: InterpreterClient) {
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

        const module = (await import(fileUrl)) as { default: { new (): Plugin } };
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
    async fetchPythonPlugin(interpreter: InterpreterClient, filePath: string) {
        const pathArr = filePath.split('/');
        const filename = pathArr.pop();
        // TODO: Would be probably be better to store plugins somewhere like /plugins/python/ or similar
        await interpreter._remote.loadFileFromURL(filename, filePath);

        //refresh module cache before trying to import module files into interpreter
        await interpreter._remote.invalidate_module_path_cache();

        const modulename = filePath.replace(/^.*[\\/]/, '').replace('.py', '');

        console.log(`importing ${modulename}`);
        // TODO: This is very specific to Pyodide API and will not work for other interpreters,
        //       when we add support for other interpreters we will need to move this to the
        //       interpreter API level and allow each one to implement it in its own way
        const module = await interpreter.pyimport(modulename);
        if (typeof (await module.plugin) !== 'undefined') {
            const py_plugin = await module.plugin;
            py_plugin.init(this);
            this.plugins.addPythonPlugin(py_plugin);
        } else {
            logger.error(`Cannot find plugin on Python module ${modulename}! Python plugins \
modules must contain a "plugin" attribute. For more information check the plugins documentation.`);
        }
    }

    // lifecycle (7)
    async executeScripts(interpreter: InterpreterClient) {
        // make_PyScript takes an interpreter and a PyScriptApp as arguments
        this.PyScript = make_PyScript(interpreter, this);
        customElements.define('py-script', this.PyScript);
        this.incrementPendingTags();
        this.decrementPendingTags();
        await this.scriptTagsPromise;
        await this.interpreter._remote.pyscript_internal.schedule_deferred_tasks();
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

globalThis.pyscript_get_config = () => globalApp.config;

// main entry point of execution
const globalApp = new PyScriptApp();

// This top level execution causes trouble in jest
if (typeof jest === 'undefined') {
    globalApp.readyPromise = globalApp.main();
}

export { version } from './version';
