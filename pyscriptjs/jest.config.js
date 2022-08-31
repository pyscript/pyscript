//jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
      'ts-jest': {
          tsconfig: 'tsconfig.json',
          useESM: true
      }
    },
    verbose: true,
    testEnvironmentOptions: {
        url: "http://localhost"
    },
    moduleNameMapper: {
      "^[./a-zA-Z0-9$_-]+\\.py$": "<rootDir>/__mocks__/fileMock.js",
    }
  };
