declare namespace _default {
    export { type };
    export function module(version?: string): string;
    export function engine({ loadPyodide }: {
        loadPyodide: any;
    }, config: any, url: any): Promise<any>;
    export { registerJSModule };
    export { run };
    export { runAsync };
    export { runEvent };
    export function transform(interpreter: any, value: any): any;
    export function writeFile({ FS, PATH, _module: { PATH_FS } }: {
        FS: any;
        PATH: any;
        _module: {
            PATH_FS: any;
        };
    }, path: any, buffer: any): any;
}
export default _default;
declare const type: "pyodide";
import { registerJSModule } from './_python.js';
import { run } from './_python.js';
import { runAsync } from './_python.js';
import { runEvent } from './_python.js';
