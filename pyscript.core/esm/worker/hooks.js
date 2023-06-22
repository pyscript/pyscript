// REQUIRES INTEGRATION TEST
/* c8 ignore start */
const workerHooks = [
    ["beforeRun", "codeBeforeRunWorker"],
    ["beforeRunAsync", "codeBeforeRunWorkerAsync"],
    ["afterRun", "codeAfterRunWorker"],
    ["afterRunAsync", "codeAfterRunWorkerAsync"],
];

export class Hook {
    constructor(fields) {
        for (const [key, value] of workerHooks) this[key] = fields[value]?.();
    }
}
/* c8 ignore stop */
