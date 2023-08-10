declare namespace _default {
    export { type };
    export let experimental: boolean;
    export function module(version?: string): string;
    export function engine({ DefaultRubyVM }: {
        DefaultRubyVM: any;
    }, config: any, url: any): Promise<any>;
    export function registerJSModule(interpreter: any, _: any, value: any): void;
    export function run(interpreter: any, code: any): any;
    export function runAsync(interpreter: any, code: any): any;
    export function runEvent(interpreter: any, code: any, event: any): Promise<void>;
    export function transform(_: any, value: any): any;
    export function writeFile(): never;
}
export default _default;
declare const type: "ruby-wasm-wasi";
