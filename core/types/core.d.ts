export function donkey(options: any): Promise<{
    process: (code: any) => Promise<any>;
    execute: (code: any) => Promise<any>;
    evaluate: (code: any) => Promise<any>;
    clear: () => Promise<void>;
    reset: () => Promise<void>;
    kill: () => void;
}>;
export function offline_interpreter(config: any): string;
import codemirror from "./plugins/codemirror.js";
import { stdlib } from "./stdlib.js";
import { optional } from "./stdlib.js";
import { inputFailure } from "./hooks.js";
import TYPES from "./types.js";
import { relative_url } from "./config.js";
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
declare const exportedWhenDefined: (type: string) => Promise<object>;
export { codemirror, stdlib, optional, inputFailure, TYPES, relative_url, exportedPyWorker as PyWorker, exportedMPWorker as MPWorker, exportedHooks as hooks, exportedConfig as config, exportedWhenDefined as whenDefined };
