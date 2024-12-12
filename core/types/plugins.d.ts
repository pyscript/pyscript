declare const _default: {
    codemirror: () => Promise<typeof import("./plugins/codemirror.js")>;
    "deprecations-manager": () => Promise<typeof import("./plugins/deprecations-manager.js")>;
    donkey: () => Promise<typeof import("./plugins/donkey.js")>;
    error: () => Promise<typeof import("./plugins/error.js")>;
    "py-editor": () => Promise<typeof import("./plugins/py-editor.js")>;
    "py-game": () => Promise<typeof import("./plugins/py-game.js")>;
    "py-terminal": () => Promise<typeof import("./plugins/py-terminal.js")>;
};
export default _default;
