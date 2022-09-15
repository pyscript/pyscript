import { BaseEvalElement } from './base';
import { appConfig, addInitializer, runtimeLoaded } from '../stores';
import type { AppConfig, Runtime } from '../runtime';
import { PyodideRuntime } from '../pyodide';
import { getLogger } from '../logger';
import { readTextFromPath, handleFetchError, mergeConfig, validateConfig } from '../utils'

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
import defaultConfig from '../pyscript.json';

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

    extractFromSrc() {
        if (this.hasAttribute('src'))
        {
            logger.info('config set from src attribute');
            return validateConfig(readTextFromPath(this.getAttribute('src')));
        }
        return {};
    }

    extractFromInline() {
        if (this.innerHTML!=='')
        {
            this.code = this.innerHTML;
            this.innerHTML = '';
            logger.info('config set from inline');
            return validateConfig(this.code);
        }
        return {};
    }

    connectedCallback() {
        let srcConfig = this.extractFromSrc();
        const inlineConfig = this.extractFromInline();
        // first make config from src whole if it is partial
        srcConfig = mergeConfig(srcConfig, defaultConfig);
        // then merge inline config and config from src
        this.values = mergeConfig(inlineConfig, srcConfig);

        appConfig.set(this.values);
        logger.info('config set:', this.values);

        addInitializer(this.loadPackages);
        addInitializer(this.loadPaths);
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

    loadPackages = async () => {
        const env = appConfig_.packages;
        logger.info("Loading env: ", env);
        await runtimeSpec.installPackage(env);
    }

    loadPaths = async () => {
        const paths = appConfig_.paths;
        logger.info("Paths to load: ", paths)
        for (const singleFile of paths) {
            logger.info(`  loading path: ${singleFile}`);
            try {
                await runtimeSpec.loadFromFile(singleFile);
            } catch (e) {
                //Should we still export full error contents to console?
                handleFetchError(<Error>e, singleFile);
            }
        }
        logger.info("All paths loaded");
    }

    loadRuntimes() {
        logger.info('Initializing runtimes');
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
