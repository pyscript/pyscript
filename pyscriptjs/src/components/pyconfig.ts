import { BaseEvalElement } from './base';
import { appConfig, addInitializer, runtimeLoaded } from '../stores';
import type { AppConfig, Runtime } from '../runtime';
import { PyodideRuntime } from '../pyodide';
import { getLogger } from '../logger';
import { readTextFromPath, handleFetchError, globalExport } from '../utils'

// Subscriber used to connect to the first available runtime (can be pyodide or others)
let runtimeSpec: Runtime;
runtimeLoaded.subscribe(value => {
    runtimeSpec = value;
});

let appConfig_: AppConfig;
appConfig.subscribe(value => {
    appConfig_ = value;
});

const logger = getLogger('py-config');

function pyscript_get_config() {
    return appConfig_;
}
globalExport('pyscript_get_config', pyscript_get_config);


/**
 * Configures general metadata about the PyScript application such
 * as a list of runtimes, name, version, closing the loader
 * automatically, etc.
 *
 * Also initializes the different runtimes passed. If no runtime is passed,
 * the default runtime based on Pyodide is used.
 */

export class PyConfig {
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    values: AppConfig;
    constructor(config: AppConfig) {
        this.values = config;
    }

    connectedCallback() {
        appConfig.set(this.values);
        logger.info('config set:', this.values);
    }

    log(msg: string) {
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        //this.remove();
    }


}
