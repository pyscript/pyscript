import * as jsyaml from 'js-yaml';
import { BaseEvalElement } from './base';
import { appConfig } from '../stores';
import type { AppConfig } from '../runtime';
import { Runtime } from '../runtime';
import { PyodideRuntime } from '../pyodide';

const DEFAULT_RUNTIME: Runtime = new PyodideRuntime();

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
            };
        } else {
            // eslint-disable-next-line
            // @ts-ignore
            this.values = loadedValues;
        }
        if (this.values.runtimes === undefined) {
            this.values.runtimes = [DEFAULT_RUNTIME];
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
        for (let runtime of this.values.runtimes) {

            if (!(runtime instanceof Runtime))
            {
                if (runtime.src.endsWith('pyodide.js')) {
                    runtime = new PyodideRuntime(runtime.src, runtime.name, runtime.lang);
                }
            }
            const script = document.createElement('script'); // create a script DOM node
            script.src = runtime.src; // set its src to the provided URL
            script.addEventListener('load', () => {
                void runtime.initialize();
            });
            document.head.appendChild(script);
        }
    }
}
