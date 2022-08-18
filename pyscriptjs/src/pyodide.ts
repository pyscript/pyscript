import { Runtime } from './runtime';
import { getLastPath } from './utils';
import type { AppConfig, PyodideInterface } from './runtime';
import type { PyLoader } from './components/pyloader';
import type { PyScript } from './components/pyscript';
// eslint-disable-next-line
// @ts-ignore
import pyscript from './pyscript.py';
import {
    runtimeLoaded,
    globalLoader,
    loadedEnvironments,
    initializers,
    postInitializers,
    Initializer,
    scriptsQueue,
    appConfig,
} from './stores';

/*
Usage of initializers, postInitializers, scriptsQueue, etc.
is moved here (from `pyconfig.ts`) along with the `PyodideRuntime` class
which now extends from the `Runtime` parent class.
*/

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

export class PyodideRuntime extends Runtime {
    src = 'https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js';
    name = 'pyodide-default';
    lang = 'python';
    interpreter: PyodideInterface;

    async loadInterpreter(): Promise<void> {
        console.log('creating pyodide runtime');
        // eslint-disable-next-line
        // @ts-ignore
        this.interpreter = await loadPyodide({
            stdout: console.log,
            stderr: console.log,
            fullStdLib: false,
        });

        // now that we loaded, add additional convenience functions
        console.log('loading micropip');
        await this.loadPackage('micropip');

        console.log('loading pyscript...');
        const output = await this.runCodeAsync(pyscript);
        if (output !== undefined) {
            console.log(output);
        }

        console.log('done setting up environment');
    }

    runCode(code: string): any {
        return this.interpreter.runPython(code);
    }

    async runCodeAsync(code: string): Promise<any> {
        return await this.interpreter.runPythonAsync(code);
    }

    getGlobals(): any {
        return this.interpreter.globals;
    }

    registerJsModule(name: string, module: object): void {
        this.interpreter.registerJsModule(name, module);
    }

    async loadPackage(names: string | string[]): Promise<void> {
        await this.interpreter.loadPackage(names);
    }

    async installPackage(package_name: string | string[]): Promise<void> {
        if (package_name.length > 0){
            const micropip = this.getGlobals().get('micropip');
            await micropip.install(package_name);
            micropip.destroy();
        }
    }

    async loadFromFile(s: string): Promise<void> {
        const filename = getLastPath(s);
        await this.runCodeAsync(
            `
                from pyodide.http import pyfetch
                from js import console

                try:
                    response = await pyfetch("${s}")
                except Exception as err:
                    console.warn("PyScript: Access to local files (using 'paths:' in py-env) is not available when directly opening a HTML file; you must use a webserver to serve the additional files. See https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062 on starting a simple webserver with Python.")
                    raise(err)
                content = await response.bytes()
                with open("${filename}", "wb") as f:
                    f.write(content)
            `,
        );
    }

    async initialize(): Promise<void> {
        loader?.log('Loading runtime...');
        await this.loadInterpreter();
        const newEnv = {
            id: 'a',
            runtime: this,
            state: 'loading',
        };
        runtimeLoaded.set(this);

        // Inject the loader into the runtime namespace
        // eslint-disable-next-line
        this.getGlobals().set('pyscript_loader', loader);

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
