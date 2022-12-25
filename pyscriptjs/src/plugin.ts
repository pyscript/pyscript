import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';
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
    afterSetup(runtime: Runtime) {}

    /** Startup complete. The interpreter is initialized and ready, user
     * scripts have been executed: the main initialization logic ends here and
     * the page is ready to accept user interactions.
     */
    afterStartup(runtime: Runtime) {}

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

    private setUpPlugins = (property: keyof Plugin, parameter: any) => {
        for (const p of this._plugins) p[property](parameter);
        for (const p of this._pythonPlugins) p[property]?.(parameter);
    }

    add(...plugins: Plugin[]) {
        for (const p of plugins) this._plugins.push(p);
    }

    addPythonPlugin(plugin: any) {
        this._pythonPlugins.push(plugin);
    }

    configure(config: AppConfig) {
        this.setUpPlugins('configure', config)
    }

    beforeLaunch(config: AppConfig) {
        this.setUpPlugins('beforeLaunch', config);
    }

    afterSetup(runtime: Runtime) {
        this.setUpPlugins('afterSetup', runtime);
    }

    afterStartup(runtime: Runtime) {
        this.setUpPlugins('afterStartup', runtime);
    }

    onUserError(error: UserError) {
        this.setUpPlugins('onUserError', error);
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
