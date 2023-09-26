declare namespace _default {
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
export default _default;
