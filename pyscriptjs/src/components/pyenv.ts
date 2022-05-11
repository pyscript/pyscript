import * as jsyaml from 'js-yaml';

import { pyodideLoaded, addInitializer } from '../stores';
import { loadPackage, loadFromFile } from '../interpreter';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let runtime;

pyodideLoaded.subscribe(value => {
    runtime = value;
    console.log('RUNTIME READY');
});

export class PyEnv extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    code: string;
    environment: unknown;
    runtime: any;
    env: string[];
    paths: string[];

    constructor() {
        super();

        this.shadow = this.attachShadow({ mode: 'open' });
        this.wrapper = document.createElement('slot');
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        const env: string[] = [];
        const paths: string[] = [];

        this.environment = jsyaml.load(this.code);
        if (this.environment === undefined) return;

        for (const entry of Array.isArray(this.environment) ? this.environment : []) {
            if (typeof entry == 'string') {
                env.push(entry);
            } else if (entry && typeof entry === 'object') {
                const obj = <Record<string, unknown>>entry;
                for (const path of Array.isArray(obj.paths) ? obj.paths : []) {
                    if (typeof path === 'string') {
                        paths.push(path);
                    }
                }
            }
        }

        this.env = env;
        this.paths = paths;

        async function loadEnv() {
            await loadPackage(env, runtime);
            console.log('environment loaded');
        }

        async function loadPaths() {
            for (const singleFile of paths) {
                console.log(`loading ${singleFile}`);
                await loadFromFile(singleFile, runtime);
            }
            console.log('paths loaded');
        }

        addInitializer(loadEnv);
        addInitializer(loadPaths);
        console.log('environment loading...', this.env);
    }
}
