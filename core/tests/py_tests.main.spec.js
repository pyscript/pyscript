import { test, expect } from '@playwright/test';

const timeout = 60 * 1000;

test.setTimeout(timeout);

test('Python unit tests - MicroPython on MAIN thread', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/python/index.html');
  const result = page.locator("#result");  // Payload for results will be here.
  await result.waitFor({ timeout });  // wait for the result.
  const data = JSON.parse(await result.textContent());  // get the result data.
  await expect(data.fails).toMatchObject([]);  // ensure no test failed.
});

test('Python unit tests - Pyodide on MAIN thread', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/python/index.html?type=py');
  const result = page.locator("#result");  // Payload for results will be here.
  await result.waitFor({ timeout });  // wait for the result.
  const data = JSON.parse(await result.textContent());  // get the result data.
  await expect(data.fails).toMatchObject([]);  // ensure no test failed.
});
