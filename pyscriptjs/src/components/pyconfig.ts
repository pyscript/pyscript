import * as jsyaml from 'js-yaml';
import { BaseEvalElement } from './base';
import { appConfig } from '../stores';
import type { Runtime, AppConfig } from '../runtime';
import { PyodideRuntime } from '../pyodide';

/*
Usage of initializers, postInitializers, scriptsQueue, etc.
is moved to `pyodide.ts` along with the `PyodideRuntime` class
which now extends from the `Runtime` parent class. This is because
all code pertaining to the pyodide runtime is in one place now,
not polluting / mixing up with the functionality of `PyConfig`
*/

const DEFAULT_RUNTIME: Runtime = new PyodideRuntime();

export class PyConfig extends BaseEvalElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    code: string;
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
        for (const runtime of this.values.runtimes) {
            const script = document.createElement('script'); // create a script DOM node
            script.src = runtime.src; // set its src to the provided URL
            script.addEventListener('load', () => {
                void runtime.initialize();
            });
            document.head.appendChild(script);
        }
    }
}
