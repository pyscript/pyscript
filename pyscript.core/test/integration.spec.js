const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const playwright = require('@playwright/test');

// integration tests for interpreters
const TEST_INTERPRETER = join(__dirname, 'integration');

// source of truth for interpreters
const CORE_INTERPRETER = join(__dirname, '..', 'esm', 'interpreter');

for (const file of readdirSync(TEST_INTERPRETER)) {
  // filter only JS files that match their counter-part interpreter
  if (/\.js$/.test(file) && existsSync(join(CORE_INTERPRETER, file))) {
    require(join(TEST_INTERPRETER, file))(
      playwright,
      `http://localhost:8080/test/integration/interpreter/${file.slice(0, -3)}`
    );
  }
}
