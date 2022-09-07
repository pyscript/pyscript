import * as jsyaml from 'js-yaml';

import { runtimeLoaded, addInitializer } from '../stores';
import { handleFetchError } from '../utils';
import type { Runtime } from '../runtime';
import { getLogger } from '../logger';

const logger = getLogger('py-env');

// Premise used to connect to the first available runtime (can be pyodide or others)
let runtime: Runtime;

runtimeLoaded.subscribe(value => {
    runtime = value;
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
        logger.info("The <py-env> tag is depreciated, please use <py-config> instead. For more information, visit...")
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
            logger.info("Loading env: ", env);
            await runtime.installPackage(env);
        }

        async function loadPaths() {
            logger.info("Paths to load: ", paths)
            for (const singleFile of paths) {
                logger.info(`  loading path: ${singleFile}`);
                try {
                    await runtime.loadFromFile(singleFile);
                } catch (e) {
                    //Should we still export full error contents to console?
                    handleFetchError(<Error>e, singleFile);
                }
            }
            logger.info("All paths loaded");
        }

        addInitializer(loadEnv);
        addInitializer(loadPaths);
    }
}
