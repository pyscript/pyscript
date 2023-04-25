//jest.config.js
module.exports = {
    preset: 'ts-jest',
    setupFilesAfterEnv: ['./tests/unit/setup.ts'],
    testEnvironment: './jest-environment-jsdom.js',
    testTimeout: 5000,
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                useESM: true,
            },
        ],
    },
    verbose: true,
    testEnvironmentOptions: {
        url: 'http://localhost',
    },
    moduleNameMapper: {
        '^.*?pyscript.py$': '<rootDir>/__mocks__/_pyscript.js',
        '^[./a-zA-Z0-9$_-]+\\.py$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css)$': '<rootDir>/__mocks__/cssMock.js',
    },
};
