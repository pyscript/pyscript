declare namespace _default {
    const type: string[];
    function module(): string;
    function engine(
        {
            loadMicroPython,
        }: {
            loadMicroPython: any;
        },
        config: any,
        url: any,
    ): Promise<any>;
    function run(runtime: any, code: any): any;
    function runAsync(runtime: any, code: any): any;
    function runEvent(runtime: any, code: any, key: any): any;
    function runWorker(runtime: any, code: any, xworker: any): any;
    function runWorkerAsync(runtime: any, code: any, xworker: any): any;
    function writeFile(
        {
            FS,
        }: {
            FS: any;
        },
        path: any,
        buffer: any,
    ): any;
}
export default _default;
