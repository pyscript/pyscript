import type { loadPyodide } from 'pyodide';
import { loadInterpreter } from './interpreter';
import { RuntimeEngine } from './runtime';
import type { AppConfig } from './runtime';
import type { PyLoader } from './components/pyloader';
import type { PyScript } from './components/pyscript';
import {
    pyodideLoaded,
    globalLoader,
    loadedEnvironments,
    initializers,
    postInitializers,
    Initializer,
    scriptsQueue,
    appConfig,
} from './stores';

let loader: PyLoader | undefined;
globalLoader.subscribe(value => {
    loader = value;
});

let initializers_: Initializer[];
initializers.subscribe((value: Initializer[]) => {
    initializers_ = value;
    console.log('initializers set');
});

let postInitializers_: Initializer[];
postInitializers.subscribe((value: Initializer[]) => {
    postInitializers_ = value;
    console.log('post initializers set');
});

let scriptsQueue_: PyScript[];
scriptsQueue.subscribe((value: PyScript[]) => {
    scriptsQueue_ = value;
    console.log('scripts queue set');
});

let appConfig_: AppConfig = {
    autoclose_loader: true,
};

appConfig.subscribe((value: AppConfig) => {
    if (value) {
        appConfig_ = value;
    }
    console.log('config set!');
});

// The current release doesn't export `PyodideInterface` type
export type PyodideInterface = Awaited<ReturnType<typeof loadPyodide>>;

export class PyodideRuntime extends RuntimeEngine {
    src: string = 'https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js';
    name: string = 'pyodide-default';
    lang: string = 'python';

    async initialize(): Promise<void> {
        loader?.log('Loading runtime...');
        const pyodide: PyodideInterface = await loadInterpreter(this.src);
        const newEnv = {
            id: 'a',
            runtime: pyodide,
            state: 'loading',
        };
        pyodideLoaded.set(pyodide);

        // Inject the loader into the runtime namespace
        // eslint-disable-next-line
        pyodide.globals.set('pyscript_loader', loader);

        loader?.log('Runtime created...');
        loadedEnvironments.update(environments => ({
            ...environments,
            [newEnv['id']]: newEnv,
        }));

        // now we call all initializers before we actually executed all page scripts
        loader?.log('Initializing components...');
        for (const initializer of initializers_) {
            await initializer();
        }

        loader?.log('Initializing scripts...');
        for (const script of scriptsQueue_) {
            await script.evaluate();
        }
        scriptsQueue.set([]);

        // now we call all post initializers AFTER we actually executed all page scripts
        loader?.log('Running post initializers...');

        if (appConfig_ && appConfig_.autoclose_loader) {
            loader?.close();
            console.log('------ loader closed ------');
        }

        for (const initializer of postInitializers_) {
            await initializer();
        }
        console.log('===PyScript page fully initialized===');
    }
}
