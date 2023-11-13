import TYPES from "./types.js";
/**
 * A `Worker` facade able to bootstrap on the worker thread only a PyScript module.
 * @param {string} file the python file to run ina worker.
 * @param {{config?: string | object, async?: boolean}} [options] optional configuration for the worker.
 * @returns {Worker & {sync: ProxyHandler<object>}}
 */
declare function exportedPyWorker(file: string, options?: {
    config?: string | object;
    async?: boolean;
}): Worker & {
    sync: ProxyHandler<object>;
};
declare const exportedHooks: {
    main: {
        onWorker: Set<Function>;
        onReady: Set<Function>;
        onBeforeRun: Set<Function>;
        onBeforeRunAsync: Set<Function>;
        onAfterRun: Set<Function>;
        onAfterRunAsync: Set<Function>;
        codeBeforeRun: Set<string>;
        codeBeforeRunAsync: Set<string>;
        codeAfterRun: Set<string>;
        codeAfterRunAsync: Set<string>;
    };
    worker: {
        onReady: Set<Function>;
        onBeforeRun: Set<Function>;
        onBeforeRunAsync: Set<Function>;
        onAfterRun: Set<Function>;
        onAfterRunAsync: Set<Function>;
        codeBeforeRun: Set<string>;
        codeBeforeRunAsync: Set<string>;
        codeAfterRun: Set<string>;
        codeAfterRunAsync: Set<string>;
    };
};
declare const exportedConfig: {};
declare const exportedWhenDefined: (type: string) => Promise<any>;
import sync from "./sync.js";
export { TYPES, exportedPyWorker as PyWorker, exportedHooks as hooks, exportedConfig as config, exportedWhenDefined as whenDefined };
