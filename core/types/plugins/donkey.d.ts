declare function _default(options?: {}): Promise<{
    process: (code: any) => Promise<any>;
    execute: (code: any) => Promise<any>;
    evaluate: (code: any) => Promise<any>;
    clear: () => Promise<void>;
    reset: () => Promise<void>;
    kill: () => void;
}>;
export default _default;
