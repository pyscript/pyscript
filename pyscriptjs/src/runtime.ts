import type { AppConfig } from './pyconfig';
import type { PyodideInterface, PyProxy } from 'pyodide';
import { getLogger } from './logger';

const logger = getLogger('pyscript/runtime');

export const version:JSON = <JSON><unknown>{"year": 2022, "month": 9, "patch": 1, "releaselevel": "dev", "commit": "dev"};
export type RuntimeInterpreter = PyodideInterface | null;

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
    config: AppConfig;
    abstract src: string;
    abstract name?: string;
    abstract lang?: string;
    abstract interpreter: RuntimeInterpreter;
    /**
     * global symbols table for the underlying interpreter.
     * */
    abstract globals: PyProxy;

    constructor(config: AppConfig) {
        super();
        this.config = config;
    }

    /**
     * loads the interpreter for the runtime and saves an instance of it
     * in the `this.interpreter` property along with calling of other
     * additional convenience functions.
     * */
    abstract loadInterpreter(): Promise<void>;

    /**
     * imports the information from the AppConfig object into the runtime.
     * what (if anything) the runtime does with this data is runtime-specific
     */
     abstract importAppConfig(config: AppConfig): Promise<any>;


    /**
     * delegates the code to be run to the underlying interpreter
     * (asynchronously) which can call its own API behind the scenes.
     * Python exceptions are turned into JS exceptions.
     * */
    abstract run(code: string): Promise<unknown>;

    /**
     * Same as run, but Python exceptions are not propagated: instead, they
     * are logged to the console.
     *
     * This is a bad API and should be killed/refactored/changed eventually,
     * but for now we have code which relies on it.
     * */
    async runButDontRaise(code: string): Promise<unknown> {
        return this.run(code).catch(err => {
            const error = err as Error;
            logger.error('Error:', error);
        });
    }

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
    abstract loadFromFile(path: string, fetch_path: string): Promise<void>;
}
