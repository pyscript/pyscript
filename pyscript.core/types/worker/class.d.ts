declare function _default(
    ...args: any[]
): (url: string, options?: WorkerOptions) => Worker;
export default _default;
/**
 * plugin configuration
 */
export type WorkerOptions = {
    /**
     * the runtime/interpreter type to use
     */
    type: string;
    /**
     * the optional runtime version to use
     */
    version?: string;
    /**
     * the optional config to use within such runtime
     */
    config?: string;
};
