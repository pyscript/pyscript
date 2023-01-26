import type { AppConfig } from './pyconfig';
import type { Interpreter } from './interpreter';
import type { UserError } from './exceptions';
import { getLogger } from './logger';

const logger = getLogger('plugin');

export class Plugin {
    /** Validate the configuration of the plugin and handle default values.
     *
     * Individual plugins are expected to check that the config keys/sections
     * which are relevant to them contains valid values, and to raise an error
     * if they contains unknown keys.
     *
     * This is also a good place where set default values for those keys which
     * are not specified by the user.
     *
     * This hook should **NOT** contain expensive operations, else it delays
     * the download of the python interpreter which is initiated later.
     */
    configure(config: AppConfig) {}

    /** The preliminary initialization phase is complete and we are about to
     * download and launch the Python interpreter.
     *
     * We can assume that the page is already shown to the user and that the
     * DOM content has been loaded. This is a good place where to add tags to
     * the DOM, if needed.
     *
     * This hook should **NOT** contain expensive operations, else it delays
     * the download of the python interpreter which is initiated later.
     */
    beforeLaunch(config: AppConfig) {}

    /** The Python interpreter has been launched, the virtualenv has been
     * installed and we are ready to execute user code.
     *
     * The <py-script> tags will be executed after this hook.
     */
    afterSetup(interpreter: Interpreter) {}

    /** The source of a <py-script>> tag has been fetched, and we're about
     * to evaluate that source using the provided interpreter.
     *
     * @param options.interpreter The Interpreter object that will be used to evaluated the Python source code
     * @param options.src {string} The Python source code to be evaluated
     * @param options.pyScriptTag The <py-script> HTML tag that originated the evaluation
     */
    beforePyScriptExec(options: {interpreter: Interpreter, src: string, pyScriptTag: HTMLElement}) {}

    /** The Python in a <py-script> has just been evaluated, but control
     * has not been ceded back to the JavaScript event loop yet
     *
     * @param options.interpreter The Interpreter object that will be used to evaluated the Python source code
     * @param options.src {string} The Python source code to be evaluated
     * @param options.pyScriptTag The <py-script> HTML tag that originated the evaluation
     * @param options.result The returned result of evaluating the Python (if any)
     */
    afterPyScriptExec(options: {interpreter: Interpreter, src: string, pyScriptTag: HTMLElement, result: any}) {}

    /** Startup complete. The interpreter is initialized and ready, user
     * scripts have been executed: the main initialization logic ends here and
     * the page is ready to accept user interactions.
     */
    afterStartup(interpreter: Interpreter) {}

    /** Called when an UserError is raised
     */
    onUserError(error: UserError) {}
}

export class PluginManager {
    _plugins: Plugin[];
    _pythonPlugins: any[];

    constructor() {
        this._plugins = [];
        this._pythonPlugins = [];
    }

    add(...plugins: Plugin[]) {
        for (const p of plugins) this._plugins.push(p);
    }

    addPythonPlugin(plugin: any) {
        this._pythonPlugins.push(plugin);
    }

    configure(config: AppConfig) {
        for (const p of this._plugins) p.configure(config);

        for (const p of this._pythonPlugins) p.configure?.(config);
    }

    beforeLaunch(config: AppConfig) {
        for (const p of this._plugins) {
            try {
                p.beforeLaunch(config);
            } catch (e) {
                logger.error(`Error while calling beforeLaunch hook of plugin ${p.constructor.name}`, e);
            }
        }
    }

    afterSetup(interpreter: Interpreter) {
        for (const p of this._plugins) {
            try {
                p.afterSetup(interpreter);
            } catch (e) {
                logger.error(`Error while calling afterSetup hook of plugin ${p.constructor.name}`, e);
            }
        }

        for (const p of this._pythonPlugins) p.afterSetup?.(interpreter);
    }

    afterStartup(interpreter: Interpreter) {
        for (const p of this._plugins) p.afterStartup(interpreter);

        for (const p of this._pythonPlugins) p.afterStartup?.(interpreter);
    }

    beforePyScriptExec(options: {interpreter: Interpreter, src: string, pyScriptTag: HTMLElement}) {
        for (const p of this._plugins) p.beforePyScriptExec(options);

        for (const p of this._pythonPlugins) p.beforePyScriptExec?.callKwargs(options);
    }

    afterPyScriptExec(options: {interpreter: Interpreter, src: string, pyScriptTag: HTMLElement, result: any}) {
        for (const p of this._plugins) p.afterPyScriptExec(options);

        for (const p of this._pythonPlugins) p.afterPyScriptExec?.callKwargs(options);
    }

    onUserError(error: UserError) {
        for (const p of this._plugins) p.onUserError(error);

        for (const p of this._pythonPlugins) p.onUserError?.(error);
    }
}

/**
 * Defines a new CustomElement (via customElement.defines) with `tag`,
 * where the new CustomElement is a proxy that delegates the logic to
 * pyPluginClass.
 *
 * @param tag - tag that will be used to define the new CustomElement (i.e: "py-script")
 * @param pyPluginClass - class that will be used to create instance to be
 *                        used as CustomElement logic handler. Any DOM event
 *                        received by the newly created CustomElement will be
 *                        delegated to that instance.
 */
export function define_custom_element(tag: string, pyPluginClass: any): any {
    logger.info(`creating plugin: ${tag}`);
    class ProxyCustomElement extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;
        pyPluginInstance: any;
        originalInnerHTML: string;

        constructor() {
            logger.debug(`creating ${tag} plugin instance`);
            super();

            this.shadow = this.attachShadow({ mode: 'open' });
            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);
            this.originalInnerHTML = this.innerHTML;
            this.pyPluginInstance = pyPluginClass(this);
        }

        connectedCallback() {
            const innerHTML = this.pyPluginInstance.connect();
            if (typeof innerHTML === 'string') this.innerHTML = innerHTML;
        }
    }

    customElements.define(tag, ProxyCustomElement);
}
