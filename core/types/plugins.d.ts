declare const _default: {
    "deprecations-manager": () => Promise<typeof import("./plugins/deprecations-manager.js")>;
    donkey: () => Promise<typeof import("./plugins/donkey.js")>;
    error: () => Promise<typeof import("./plugins/error.js")>;
    "py-editor": () => Promise<typeof import("./plugins/py-editor.js")>;
    "py-terminal": () => Promise<typeof import("./plugins/py-terminal.js")>;
};
export default _default;
