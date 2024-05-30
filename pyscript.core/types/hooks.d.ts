export function main(name: any): any;
export function worker(name: any): any;
export function codeFor(branch: any, type: any): {};
export function createFunction(self: any, name: any): any;
export const inputFailure: "\n    import builtins\n    def input(prompt=\"\"):\n        raise Exception(\"\\n           \".join([\n            \"input() doesn't work when PyScript runs in the main thread.\",\n            \"Consider using the worker attribute: https://pyscript.github.io/docs/2023.11.2/user-guide/workers/\"\n        ]))\n\n    builtins.input = input\n    del builtins\n    del input\n";
export namespace hooks {
    namespace main {
        let onWorker: Set<Function>;
        let onReady: Set<Function>;
        let onBeforeRun: Set<Function>;
        let onBeforeRunAsync: Set<Function>;
        let onAfterRun: Set<Function>;
        let onAfterRunAsync: Set<Function>;
        let codeBeforeRun: Set<string>;
        let codeBeforeRunAsync: Set<string>;
        let codeAfterRun: Set<string>;
        let codeAfterRunAsync: Set<string>;
    }
    namespace worker {
        let onReady_1: Set<Function>;
        export { onReady_1 as onReady };
        let onBeforeRun_1: Set<Function>;
        export { onBeforeRun_1 as onBeforeRun };
        let onBeforeRunAsync_1: Set<Function>;
        export { onBeforeRunAsync_1 as onBeforeRunAsync };
        let onAfterRun_1: Set<Function>;
        export { onAfterRun_1 as onAfterRun };
        let onAfterRunAsync_1: Set<Function>;
        export { onAfterRunAsync_1 as onAfterRunAsync };
        let codeBeforeRun_1: Set<string>;
        export { codeBeforeRun_1 as codeBeforeRun };
        let codeBeforeRunAsync_1: Set<string>;
        export { codeBeforeRunAsync_1 as codeBeforeRunAsync };
        let codeAfterRun_1: Set<string>;
        export { codeAfterRun_1 as codeAfterRun };
        let codeAfterRunAsync_1: Set<string>;
        export { codeAfterRunAsync_1 as codeAfterRunAsync };
    }
}
