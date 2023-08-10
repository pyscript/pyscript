declare function _default(...args: any[]): (url: string, options?: WorkerOptions) => Worker;
export default _default;
/**
 * custom configuration
 */
export type WorkerOptions = {
    /**
     * the interpreter type to use
     */
    type: string;
    /**
     * the optional interpreter version to use
     */
    version?: string;
    /**
     * the optional config to use within such interpreter
     */
    config?: string;
};
