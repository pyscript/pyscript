import { test, expect } from '@playwright/test';

test('Python unit tests - MicroPython on MAIN thread', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/python/index.html');
  test.setTimeout(120*1000);  // Increase timeout for this test.
  const result = page.locator("#result");  // Payload for results will be here.
  await result.waitFor();  // wait for the result.
  const data = JSON.parse(await result.textContent());  // get the result data.
  await expect(data.fails).toMatchObject([]);  // ensure no test failed.
});

test('Python unit tests - Pyodide on MAIN thread', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/python/index.html?type=py');
  test.setTimeout(120*1000);  // Increase timeout for this test.
  const result = page.locator("#result");  // Payload for results will be here.
  await result.waitFor();  // wait for the result.
  const data = JSON.parse(await result.textContent());  // get the result data.
  await expect(data.fails).toMatchObject([]);  // ensure no test failed.
});

test('Python unit tests - MicroPython on WORKER', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/python/index.html?worker');
  test.setTimeout(120*1000);  // Increase timeout for this test.
  const result = page.locator("#result");  // Payload for results will be here.
  await result.waitFor();  // wait for the result.
  const data = JSON.parse(await result.textContent());  // get the result data.
  await expect(data.fails).toMatchObject([]);  // ensure no test failed.
});

test('Python unit tests - Pyodide on WORKER', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/python/index.html?type=py&worker');
  test.setTimeout(120*1000);  // Increase timeout for this test.
  const result = page.locator("#result");  // Payload for results will be here.
  await result.waitFor();  // wait for the result.
  const data = JSON.parse(await result.textContent());  // get the result data.
  await expect(data.fails).toMatchObject([]);  // ensure no test failed.
});
