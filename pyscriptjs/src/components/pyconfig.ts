import * as jsyaml from 'js-yaml';
import { BaseEvalElement } from './base';
import { appConfig } from '../stores';
import type { RuntimeEngine, AppConfig } from '../runtime';
import { PyodideRuntime } from '../pyodide';

const DEFAULT_RUNTIME: RuntimeEngine = new PyodideRuntime();

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
