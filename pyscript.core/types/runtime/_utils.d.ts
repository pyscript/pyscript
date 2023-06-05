export const io: WeakMap<object, any>;
export function stdio(init: any): {
    stderr: (...args: any[]) => any;
    stdout: (...args: any[]) => any;
    get(engine: any): Promise<any>;
};
export function writeFile(FS: any, path: any, buffer: any): any;
export function writeFileShim(FS: any, path: any, buffer: any): any;
export const base: WeakMap<object, any>;
export function fetchPaths(
    module: any,
    runtime: any,
    config_fetch: any,
): Promise<any[]>;
