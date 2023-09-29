declare namespace _default {
    function error(): Promise<typeof import("./plugins/error.js")>;
    function pyterminal(): Promise<typeof import("./plugins/pyterminal.js")>;
}
export default _default;
