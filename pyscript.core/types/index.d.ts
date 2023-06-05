export { registerPlugin } from "./plugins.js";
export const XWorker: (
    url: string,
    options?: import("./worker/class.js").WorkerOptions,
) => Worker;
