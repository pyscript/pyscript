//jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    globals: {
      'ts-jest': {
          tsconfig: 'tsconfig.json'
      }
    },
    verbose: true,
    testEnvironmentOptions: {
        url: "http://localhost"
    }
  };
