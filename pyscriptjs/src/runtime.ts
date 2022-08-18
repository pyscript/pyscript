import type { loadPyodide } from 'pyodide';

// The current release doesn't export `PyodideInterface` type
export type PyodideInterface = Awaited<ReturnType<typeof loadPyodide>>;
export type RuntimeInterpreter = PyodideInterface | null;

export abstract class Runtime extends Object {
    abstract src: string;
    abstract name?: string;
    abstract lang?: string;
    abstract interpreter: RuntimeInterpreter;

    abstract loadInterpreter(): Promise<void>;
    abstract initialize(): Promise<void>;
    abstract runCode(code: string): any;
    abstract runCodeAsync(code: string): Promise<any>;
    abstract getGlobals(): any;
    abstract registerJsModule(name: string, module: object): void;
    abstract loadPackage(names: string | string[]): Promise<void>;
    abstract installPackage(package_name: string | string[]): Promise<void>;
    abstract loadFromFile(s: string): Promise<void>;
}

export type AppConfig = {
    autoclose_loader: boolean;
    name?: string;
    version?: string;
    runtimes?: Array<Runtime>;
};
