export const CUSTOM_SELECTORS: any[];
export function handleCustomType(node: Element): void;
export function define(type: string, options: CustomOptions): void;
export function whenDefined(type: string): Promise<object>;
/**
 * custom configuration
 */
export type Runtime = {
    /**
     * the bootstrapped interpreter
     */
    interpreter: object;
    /**
     * an XWorker constructor that defaults to same interpreter on the Worker.
     */
    XWorker: (url: string, options?: object) => Worker;
    /**
     * a cloned config used to bootstrap the interpreter
     */
    config: object;
    /**
     * an utility to run code within the interpreter
     */
    run: (code: string) => any;
    /**
     * an utility to run code asynchronously within the interpreter
     */
    runAsync: (code: string) => Promise<any>;
    /**
     * an utility to write a file in the virtual FS, if available
     */
    writeFile: (path: string, data: ArrayBuffer) => void;
};
/**
 * custom configuration
 */
export type CustomOptions = {
    /**
     * the interpreter to use
     */
    interpreter: 'pyodide' | 'micropython' | 'wasmoon' | 'ruby-wasm-wasi';
    /**
     * the optional interpreter version to use
     */
    version?: string;
    /**
     * the optional config to use within such interpreter
     */
    config?: string;
    /**
     * the callback that will be invoked once
     */
    onInterpreterReady?: (environment: object, node: Element) => void;
};
