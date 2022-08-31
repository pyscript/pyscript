import * as jsyaml from 'js-yaml';
import { BaseEvalElement } from './base';
import { appConfig } from '../stores';
import type { AppConfig, Runtime } from '../runtime';
import { PyodideRuntime, DEFAULT_RUNTIME_CONFIG } from '../pyodide';

/**
 * Configures general metadata about the PyScript application such
 * as a list of runtimes, name, version, closing the loader
 * automatically, etc.
 *
 * Also initializes the different runtimes passed. If no runtime is passed,
 * the default runtime based on Pyodide is used.
 */

export class PyConfig extends BaseEvalElement {
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    values: AppConfig;
    constructor() {
        super();
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        const loadedValues = jsyaml.load(this.code);
        if (loadedValues === undefined) {
            this.values = {
                autoclose_loader: true,
                runtimes: [DEFAULT_RUNTIME_CONFIG]
            };
        } else {
            // eslint-disable-next-line
            // @ts-ignore
            this.values = loadedValues;
        }

        appConfig.set(this.values);
        console.log('config set', this.values);

        this.loadRuntimes();
    }

    log(msg: string) {
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        this.remove();
    }

    loadRuntimes() {
        console.log('Initializing runtimes...');
        for (const runtime of this.values.runtimes) {
            const runtimeObj: Runtime = new PyodideRuntime(runtime.src, runtime.name, runtime.lang);
            const script = document.createElement('script'); // create a script DOM node
            script.src = runtimeObj.src; // set its src to the provided URL
            script.addEventListener('load', () => {
                void runtimeObj.initialize();
            });
            document.head.appendChild(script);
        }
    }
}
