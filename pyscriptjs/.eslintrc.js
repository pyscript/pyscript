module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
    },
    env: {
        es6: true,
        browser: true,
    },
    plugins: ['@typescript-eslint'],
    ignorePatterns: ['node_modules', 'src/interpreter_worker/*'],
    rules: {
        // ts-ignore is already an explicit override, no need to have a second lint
        '@typescript-eslint/ban-ts-comment': 'off',

        // any related lints
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',

        // other rules
        'no-prototype-builtins': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowBoolean: true }],
    },
};
