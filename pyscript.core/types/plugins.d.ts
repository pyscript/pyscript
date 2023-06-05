export const PLUGINS_SELECTORS: any[];
export function handlePlugin(node: Element): void;
export function registerPlugin(name: string, options: PluginOptions): void;
/**
 * plugin configuration
 */
export type Runtime = {
    /**
     * the runtime type
     */
    type: string;
    /**
     * the bootstrapped runtime
     */
    runtime: object;
    /**
     * an XWorker constructor that defaults to same runtime on the Worker.
     */
    XWorker: (url: string, options?: object) => Worker;
    /**
     * a cloned config used to bootstrap the runtime
     */
    config: object;
    /**
     * an utility to run code within the runtime
     */
    run: (code: string) => any;
    /**
     * an utility to run code asynchronously within the runtime
     */
    runAsync: (code: string) => Promise<any>;
    /**
     * an utility to write a file in the virtual FS, if available
     */
    writeFile: (path: string, data: ArrayBuffer) => void;
};
/**
 * plugin configuration
 */
export type PluginOptions = {
    /**
     * the runtime/interpreter type to receive
     */
    type: string;
    /**
     * the optional runtime version to use
     */
    version?: string;
    /**
     * the optional config to use within such runtime
     */
    config?: string;
    /**
     * the optional environment to use
     */
    env?: string;
    /**
     * the callback that will be invoked once
     */
    onRuntimeReady: (node: Element, runtime: Runtime) => void;
};
