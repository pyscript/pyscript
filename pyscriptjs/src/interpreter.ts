import type { AppConfig } from './pyconfig';
import type { PyodideInterface, PyProxy } from 'pyodide';
import { getLogger } from './logger';

const logger = getLogger('pyscript/interpreter');

export type InterpreterInterface = PyodideInterface | null;
export type RunOptions = {
    additionalGlobals?: object;
};

/*
Interpreter class is a super class that all different interpreters must respect
and adhere to.

Currently, the only interpreter available is Pyodide as indicated by the
`InterpreterInterface` type above. This serves as a Union of types of
different interpreters which will be added in near future.

The class has abstract methods available which each interpreter is supposed
to implement.

Methods available handle loading of the interpreter, initialization,
running code, loading and installation of packages, loading from files etc.

For an example implementation, refer to the `PyodideInterpreter` class
in `pyodide.ts`
*/
export abstract class Interpreter extends Object {
    config: AppConfig;
    abstract src: string;
    abstract name?: string;
    abstract lang?: string;
    abstract interface: InterpreterInterface;
    /**
     * global symbols table for the underlying interface.
     * */
    abstract globals: PyProxy;

    constructor(config: AppConfig) {
        super();
        this.config = config;
    }

    /**
     * loads the interface for the interpreter and saves an instance of it
     * in the `this.interface` property along with calling of other
     * additional convenience functions.
     * */
    abstract loadInterpreter(): Promise<void>;

    /**
     * delegates the code to be run to the underlying interface
     * (asynchronously) which can call its own API behind the scenes.
     * Python exceptions are turned into JS exceptions.
     * */
    abstract run(code: string, options?: RunOptions): unknown;

    /**
     * Same as run, but Python exceptions are not propagated: instead, they
     * are logged to the console.
     *
     * This is a bad API and should be killed/refactored/changed eventually,
     * but for now we have code which relies on it.
     * */
    runButDontRaise(code: string): unknown {
        let result: unknown;
        try {
            result = this.run(code);
        } catch (error: unknown) {
            logger.error('Error:', error);
        }
        return result;
    }

    /**
     * delegates the setting of JS objects to
     * the underlying interface.
     * */
    abstract registerJsModule(name: string, module: object): void;

    /**
     * delegates the loading of packages to
     * the underlying interface.
     * */
    abstract loadPackage(names: string | string[]): Promise<void>;

    /**
     * delegates the installation of packages
     * (using a package manager, which can be specific to
     * the interface) to the underlying interface.
     *
     * For Pyodide, we use `micropip`
     * */
    abstract installPackage(package_name: string | string[]): Promise<void>;

    /**
     * delegates the loading of files to the
     * underlying interface.
     * */
    abstract loadFromFile(path: string, fetch_path: string): Promise<void>;

    /**
     * delegates clearing importlib's module path
     * caches to the underlying interface
     */
    abstract invalidate_module_path_cache(): void;
}
