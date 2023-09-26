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
import sync from "./sync.js";
declare const exportedConfig: {};
import hooks from "./hooks.js";
export { exportedConfig as config, hooks };
