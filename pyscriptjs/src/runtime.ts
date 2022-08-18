import type { loadPyodide } from 'pyodide';

// The current release doesn't export `PyodideInterface` type
export type PyodideInterface = Awaited<ReturnType<typeof loadPyodide>>;
export type RuntimeInterpreter = PyodideInterface | null;

/*
Runtime class is a super class that all different runtimes must respect
and adhere to.

Currently, the only runtime available is Pyodide as indicated by the
`RuntimeInterpreter` type above. This serves as a Union of types of
different runtimes/interpreters which will be added in near future.

The class has abstract methods available which each runtime is supposed
to implement. The current design is based on the Pyodide runtime (since
that is the only one available), but is subject to change.

Methods available handle loading of the interpreter, initialization,
running code, getting the globals symbol table, loading and installation
of packages, loading from files etc.

For an example implementation, refer to the `PyodideRuntime` class
in `pyodide.ts`
*/
export abstract class Runtime extends Object {
    abstract src: string;
    abstract name?: string;
    abstract lang?: string;
    abstract interpreter: RuntimeInterpreter;

    /**
     * loads the interpreter for the runtime and saves an instance of it
     * in the `this.interpreter` property along with calling of other
     * additional convenience functions. This is moved from
     * `interpreter.ts` (now deleted) as it is specific to each runtime.
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
     * delegates the getting of global symbols table to
     * the underlying interpreter.
     * */
    abstract getGlobals(): any;

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
     * the runtime) to the underlying interpreter. This is moved
     * from `interpreter.ts` (now deleted) as it is specific to each runtime.
     *
     * For Pyodide, we use `micropip`
     * */
    abstract installPackage(package_name: string | string[]): Promise<void>;

    /**
     * delegates the loading of files to the
     * underlying interpreter. This is moved from
     * `interpreter.ts` (now deleted) as it is specific to each runtime.
     * */
    abstract loadFromFile(s: string): Promise<void>;

    /**
     * delegates the initialization of the page to the
     * underlying interpreter which involves loading of runtime,
     * as well as evaluating all the code inside <py-script> tags
     * along with initializers and postInitializers
     * */
     abstract initialize(): Promise<void>;
}

export type AppConfig = {
    autoclose_loader: boolean;
    name?: string;
    version?: string;
    runtimes?: Array<Runtime>;
};
