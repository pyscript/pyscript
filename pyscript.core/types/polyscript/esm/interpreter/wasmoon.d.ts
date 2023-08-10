declare namespace _default {
    export { type };
    export function module(version?: string): string;
    export function engine({ LuaFactory, LuaLibraries }: {
        LuaFactory: any;
        LuaLibraries: any;
    }, config: any): Promise<any>;
    export function registerJSModule(interpreter: any, _: any, value: any): void;
    export function run(interpreter: any, code: any): any;
    export function runAsync(interpreter: any, code: any): any;
    export function runEvent(interpreter: any, code: any, event: any): Promise<void>;
    export function transform(_: any, value: any): any;
    export function writeFile({ cmodule: { module: { FS }, }, }: {
        cmodule: {
            module: {
                FS: any;
            };
        };
    }, path: any, buffer: any): any;
}
export default _default;
declare const type: "wasmoon";
