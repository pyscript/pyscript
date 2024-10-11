declare function _default(options?: {}): Promise<{
    process: (code: any) => Promise<any>;
    execute: (code: any) => Promise<any>;
    evaluate: (code: any) => Promise<any>;
    clear: () => any;
    reset: () => any;
    kill: () => void;
}>;
export default _default;
