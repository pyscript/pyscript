//jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: './jest-environment-jsdom.js',
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
