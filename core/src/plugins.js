// ⚠️ This file is an artifact: DO NOT MODIFY
export default {
    codemirror: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/codemirror.js"
        ),
    ["deprecations-manager"]: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/deprecations-manager.js"
        ),
    donkey: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/donkey.js"
        ),
    error: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/error.js"
        ),
    ["py-editor"]: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/py-editor.js"
        ),
    ["py-game"]: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/py-game.js"
        ),
    ["py-terminal"]: () =>
        import(
            /* webpackIgnore: true */
            "./plugins/py-terminal.js"
        ),
};
