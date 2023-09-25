export default {
    /** @type {Set<function>} */
    onBeforeRun: new Set(),
    /** @type {Set<function>} */
    onBeforeRunAsync: new Set(),
    /** @type {Set<function>} */
    onAfterRun: new Set(),
    /** @type {Set<function>} */
    onAfterRunAsync: new Set(),
    /** @type {Set<function>} */
    onInterpreterReady: new Set(),

    /** @type {Set<string>} */
    codeBeforeRunWorker: new Set(),
    /** @type {Set<string>} */
    codeBeforeRunWorkerAsync: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorker: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorkerAsync: new Set(),
};
