import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        ignores: ["**/3rd-party/"],
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
        },
        rules: {
            "no-implicit-globals": ["error"],
        },
    },
];
