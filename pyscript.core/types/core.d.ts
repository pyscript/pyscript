export function offline_interpreter(config: any): string;
import { stdlib } from "./stdlib.js";
import { optional } from "./stdlib.js";
import TYPES from "./types.js";
/**
 * A `Worker` facade able to bootstrap on the worker thread only a PyScript module.
 * @param {string} file the python file to run ina worker.
 * @param {{config?: string | object, async?: boolean}} [options] optional configuration for the worker.
 * @returns {Promise<Worker & {sync: object}>}
 */
declare function exportedPyWorker(file: string, options?: {
    config?: string | object;
    async?: boolean;
}): Promise<Worker & {
    sync: object;
}>;
/**
 * A `Worker` facade able to bootstrap on the worker thread only a PyScript module.
 * @param {string} file the python file to run ina worker.
 * @param {{config?: string | object, async?: boolean}} [options] optional configuration for the worker.
 * @returns {Promise<Worker & {sync: object}>}
 */
declare function exportedMPWorker(file: string, options?: {
    config?: string | object;
    async?: boolean;
}): Promise<Worker & {
    sync: object;
}>;
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
export { stdlib, optional, TYPES, exportedPyWorker as PyWorker, exportedMPWorker as MPWorker, exportedHooks as hooks, exportedConfig as config, exportedWhenDefined as whenDefined };
