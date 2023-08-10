export { env } from "./listeners.js";
export const XWorker: (url: string, options?: import("./worker/class.js").WorkerOptions) => Worker;
export { define, whenDefined } from "./custom.js";
