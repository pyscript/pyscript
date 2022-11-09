import type { PyScriptApp } from './main';
import type { AppConfig } from './pyconfig';
import type { Runtime } from './runtime';

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
}


export class PluginManager {
    _plugins: Plugin[];

    constructor() {
        this._plugins = [];
    }

    add(...plugins: Plugin[]) {
        for (const p of plugins)
            this._plugins.push(p);
    }

    configure(config: AppConfig) {
        for (const p of this._plugins)
            p.configure(config);
    }

    beforeLaunch(config: AppConfig) {
        for (const p of this._plugins)
            p.beforeLaunch(config);
    }

    afterSetup(runtime: Runtime) {
        for (const p of this._plugins)
            p.afterSetup(runtime);
    }
}
