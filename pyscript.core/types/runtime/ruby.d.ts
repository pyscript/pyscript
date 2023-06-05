declare namespace _default {
    const experimental: boolean;
    const type: string[];
    function module(version?: string): string;
    function engine(
        {
            DefaultRubyVM,
        }: {
            DefaultRubyVM: any;
        },
        config: any,
        url: any,
    ): Promise<any>;
    function run(runtime: any, code: any): any;
    function runAsync(runtime: any, code: any): any;
    function runEvent(runtime: any, code: any, key: any): any;
    function runWorker(runtime: any, code: any, xworker: any): any;
    function runWorkerAsync(runtime: any, code: any, xworker: any): any;
    function writeFile(): never;
}
export default _default;
