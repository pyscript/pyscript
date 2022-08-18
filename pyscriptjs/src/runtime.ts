import type { loadPyodide } from 'pyodide';
import type { PyLoader } from './components/pyloader';
import {
    runtimeLoaded,
    loadedEnvironments,
    globalLoader,
    initializers,
    postInitializers,
    Initializer,
    scriptsQueue,
    appConfig
} from './stores'
import type { PyScript } from './components/pyscript';

// The current release doesn't export `PyodideInterface` type
export type PyodideInterface = Awaited<ReturnType<typeof loadPyodide>>;
export type RuntimeInterpreter = PyodideInterface | null;

export type AppConfig = {
    autoclose_loader: boolean;
    name?: string;
    version?: string;
    runtimes?: Array<Runtime>;
};

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

/*
Runtime class is a super class that all different runtimes must respect
and adhere to.

Currently, the only runtime available is Pyodide as indicated by the
`RuntimeInterpreter` type above. This serves as a Union of types of
different runtimes/interpreters which will be added in near future.

The class has abstract methods available which each runtime is supposed
to implement.

Methods available handle loading of the interpreter, initialization,
running code, loading and installation of packages, loading from files etc.

For an example implementation, refer to the `PyodideRuntime` class
in `pyodide.ts`
*/
export abstract class Runtime extends Object {
    abstract src: string;
    abstract name?: string;
    abstract lang?: string;
    abstract interpreter: RuntimeInterpreter;
    /**
     * global symbols table for the underlying interpreter.
     * */
    abstract globals: any;

    /**
     * loads the interpreter for the runtime and saves an instance of it
     * in the `this.interpreter` property along with calling of other
     * additional convenience functions.
     * */
    abstract loadInterpreter(): Promise<void>;

    /**
     * delegates the code to be run to the underlying interpreter
     * which can call its own API behind the scenes.
     * */
    abstract runCode(code: string): any;

    /**
     * delegates the code to be run to the underlying interpreter
     * (asynchronously) which can call its own API behind the scenes.
     * */
    abstract runCodeAsync(code: string): Promise<any>;

    /**
     * delegates the setting of JS objects to
     * the underlying interpreter.
     * */
    abstract registerJsModule(name: string, module: object): void;

    /**
     * delegates the loading of packages to
     * the underlying interpreter.
     * */
    abstract loadPackage(names: string | string[]): Promise<void>;

    /**
     * delegates the installation of packages
     * (using a package manager, which can be specific to
     * the runtime) to the underlying interpreter.
     *
     * For Pyodide, we use `micropip`
     * */
    abstract installPackage(package_name: string | string[]): Promise<void>;

    /**
     * delegates the loading of files to the
     * underlying interpreter.
     * */
    abstract loadFromFile(s: string): Promise<void>;

    /**
     * delegates the initialization of the page to the
     * underlying interpreter which involves loading of runtime,
     * as well as evaluating all the code inside <py-script> tags
     * along with initializers and postInitializers
     * */
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
        this.globals.set('pyscript_loader', loader);

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
