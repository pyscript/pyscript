declare namespace _default {
    export { type };
    export function module(version?: string): string;
    export function engine({ loadMicroPython }: {
        loadMicroPython: any;
    }, config: any, url: any): Promise<any>;
    export { registerJSModule };
    export { run };
    export { runAsync };
    export { runEvent };
    export function transform(_: any, value: any): any;
    export function writeFile({ FS, _module: { PATH, PATH_FS } }: {
        FS: any;
        _module: {
            PATH: any;
            PATH_FS: any;
        };
    }, path: any, buffer: any): any;
}
export default _default;
declare const type: "micropython";
import { registerJSModule } from './_python.js';
import { run } from './_python.js';
import { runAsync } from './_python.js';
import { runEvent } from './_python.js';
