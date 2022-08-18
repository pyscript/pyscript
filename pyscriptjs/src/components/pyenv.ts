import * as jsyaml from 'js-yaml';

/*
All references to `PyodideInterface` have been replaced with
`Runtime` which has the available methods of installing packages,
loading files, etc. which each runtime is responsible for
implementing on its own.
*/

import { runtimeLoaded, addInitializer } from '../stores';
import { handleFetchError } from '../utils';
import type { Runtime } from '../runtime';

// Premise used to connect to the first available runtime (can be pyodide or others)
let runtime: Runtime;

runtimeLoaded.subscribe(value => {
    runtime = value;
    console.log('RUNTIME READY');
});

export class PyEnv extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    code: string;
    environment: unknown;
    runtime: Runtime;
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
            await runtime.installPackage(env);
            console.log('environment loaded');
        }

        async function loadPaths() {
            for (const singleFile of paths) {
                console.log(`loading ${singleFile}`);
                try {
                    await runtime.loadFromFile(singleFile);
                } catch (e) {
                    //Should we still export full error contents to console?
                    handleFetchError(<Error>e, singleFile);
                }
            }
            console.log('paths loaded');
        }

        addInitializer(loadEnv);
        addInitializer(loadPaths);
        console.log('environment loading...', this.env);
    }
}
