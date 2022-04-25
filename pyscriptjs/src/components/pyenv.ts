import * as jsyaml from 'js-yaml';

import { pyodideLoaded, loadedEnvironments, mode, addInitializer } from '../stores';
import { loadPackage, loadFromFile } from '../interpreter';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let environments;
let currentMode;

pyodideLoaded.subscribe(value => {
    pyodideReadyPromise = value;
});

loadedEnvironments.subscribe(value => {
    environments = value;
});

mode.subscribe(value => {
    currentMode = value;
});

export class PyEnv extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    code: string;
    environment: any;

    constructor() {
        super();

        this.shadow = this.attachShadow({ mode: 'open' });
        this.wrapper = document.createElement('slot');
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        const env = [];
        const paths = [];

        this.environment = jsyaml.load(this.code);
        if (this.environment === undefined) return;

        for (const entry of this.environment) {
            if (typeof entry == 'string') {
                env.push(entry);
            } else if (entry.hasOwnProperty('paths')) {
                for (const path of entry.paths) {
                    paths.push(path);
                }
            }
        }

        async function loadEnv() {
            const pyodide = await pyodideReadyPromise;
            await loadPackage(env, pyodide);
            console.log('enviroment loaded');
        }

        async function loadPaths() {
            const pyodide = await pyodideReadyPromise;
            for (const singleFile of paths) {
                await loadFromFile(singleFile, pyodide);
            }
            console.log('paths loaded');
        }
        addInitializer(loadEnv);
        addInitializer(loadPaths);
        console.log('enviroment loading...', env);
    }
}
