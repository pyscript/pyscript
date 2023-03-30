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
    ignorePatterns: ['node_modules'],
    rules: {
        // ts-ignore is already an explicit override, no need to have a second lint
        '@typescript-eslint/ban-ts-comment': 'off',

        // any-related lints
        // These two come up a lot, so they probably aren't worth it
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        // encourage people to cast "any" to a more specific type before using it
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',

        // other rules
        'no-prototype-builtins': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowBoolean: true }],
    },
};
