// ⚠️ This file is an artifact: DO NOT MODIFY
export default {
    ["deprecations-manager"]: () => import(/* webpackIgnore: true */ "./plugins/deprecations-manager.js"),
    error: () => import(/* webpackIgnore: true */ "./plugins/error.js"),
    ["py-editor"]: () => import(/* webpackIgnore: true */ "./plugins/py-editor.js"),
    ["py-terminal"]: () => import(/* webpackIgnore: true */ "./plugins/py-terminal.js"),
};
