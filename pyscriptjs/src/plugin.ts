import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
import type { UserError } from './exceptions';
import { getLogger } from './logger';

const logger = getLogger('pyscript/main');


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
    configure(config: AppConfig) {
    }

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
    beforeLaunch(config: AppConfig) {
    }

    /** The Python interpreter has been launched, the virtualenv has been
      * installed and we are ready to execute user code.
      *
      * The <py-script> tags will be executed after this hook.
      */
    afterSetup(runtime: Runtime) {
    }


    /** Startup complete. The interpreter is initialized and ready, user
     * scripts have been executed: the main initialization logic ends here and
     * the page is ready to accept user interactions.
     */
    afterStartup(runtime: Runtime) {
    }

    /** Called when an UserError is raised
     */
    onUserError(error: UserError) {
    }
}


export class PluginManager {
    _plugins: Plugin[];
    _pythonPlugins: any[];

    constructor() {
        this._plugins = [];
        this._pythonPlugins = [];
    }

    add(...plugins: Plugin[]) {
        for (const p of plugins)
            this._plugins.push(p);
    }

    addPythonPlugin(plugin: any){
        this._pythonPlugins.push(plugin);
    }

    configure(config: AppConfig) {
        for (const p of this._plugins)
            p.configure(config);

        for (const p of this._pythonPlugins)
            p.configure?.(config);
    }

    beforeLaunch(config: AppConfig) {
        for (const p of this._plugins)
            p.beforeLaunch(config);
    }

    afterSetup(runtime: Runtime) {
        for (const p of this._plugins)
            p.afterSetup(runtime);
    }

    afterStartup(runtime: Runtime) {
        for (const p of this._plugins)
            p.afterStartup(runtime);
        for (const p of this._pythonPlugins)
            if (typeof p.afterStartup !== 'undefined') {
                p.afterStartup(runtime);
            }
    }

    onUserError(error: UserError) {
        for (const p of this._plugins)
            p.onUserError(error);
    }
}


export function create_custom_element(name: string, pyObject: any, callback?: Function) : any {
    logger.info(`creating plugin: ${name}`)
    class CustomElementWrapper extends HTMLElement {
        shadow: ShadowRoot;
        wrapper: HTMLElement;
        pyObject: any;
        source: string;

        constructor() {
            logger.debug(`creating ${name} plugin instance`)
            super();

            this.shadow = this.attachShadow({ mode: 'open' });
            this.wrapper = document.createElement('slot');
            this.shadow.appendChild(this.wrapper);
            this.source = this.innerHTML;
            this.pyObject = pyObject(this);
            if (typeof callback !== 'undefined') {
                callback(this);
            }
        }

        connectedCallback() {
            const elementHtml = this.pyObject.connect();
            if (elementHtml !== undefined){
                this.innerHTML = elementHtml;
            }
        }
    }
    customElements.define(name, CustomElementWrapper);
}
