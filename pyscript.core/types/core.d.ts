/**
 * A `Worker` facade able to bootstrap on the worker thread only a PyScript module.
 * @param {string} file the python file to run ina worker.
 * @param {{config?: string | object, async?: boolean}} [options] optional configuration for the worker.
 * @returns {Worker & {sync: ProxyHandler<object>}}
 */
export function PyWorker(file: string, options?: {
    config?: string | object;
    async?: boolean;
}): Worker & {
    sync: ProxyHandler<object>;
};
export namespace hooks {
    let onBeforeRun: Set<Function>;
    let onBeforeRunAsync: Set<Function>;
    let onAfterRun: Set<Function>;
    let onAfterRunAsync: Set<Function>;
    let onInterpreterReady: Set<Function>;
    let codeBeforeRunWorker: Set<string>;
    let codeBeforeRunWorkerAsync: Set<string>;
    let codeAfterRunWorker: Set<string>;
    let codeAfterRunWorkerAsync: Set<string>;
}
import { config } from "./config.js";
import sync from "./sync.js";
