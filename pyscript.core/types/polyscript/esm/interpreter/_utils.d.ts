export function clean(code: string): string;
export const io: WeakMap<object, any>;
export function stdio(init: any): {
    stderr: (...args: any[]) => any;
    stdout: (...args: any[]) => any;
    get(engine: any): Promise<any>;
};
export function writeFile({ FS, PATH, PATH_FS }: {
    FS: any;
    PATH: any;
    PATH_FS: any;
}, path: any, buffer: any): any;
export function writeFileShim(FS: any, path: any, buffer: any): any;
export const base: WeakMap<object, any>;
export function fetchPaths(module: any, interpreter: any, config_fetch: any): Promise<any[]>;
