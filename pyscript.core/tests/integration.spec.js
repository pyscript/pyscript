import { test, expect } from '@playwright/test';

test('MicroPython display', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/mpy.html');
  await page.waitForSelector('html.done.worker');
  const body = await page.evaluate(() => document.body.innerText);
  await expect(body.trim()).toBe([
    'M-PyScript Main 1',
    'M-PyScript Main 2',
    'M-PyScript Worker',
  ].join('\n'));
});

test('MicroPython hooks', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (!text.startsWith('['))
      logs.push(text);
  });
  await page.goto('http://localhost:8080/tests/js-integration/hooks.html');
  await page.waitForSelector('html.done.worker');
  await expect(logs.join('\n')).toBe([
    'main onReady',
    'main onBeforeRun',
    'main codeBeforeRun',
    'actual code in main',
    'main codeAfterRun',
    'main onAfterRun',
    'worker onReady',
    'worker onBeforeRun',
    'worker codeBeforeRun',
    'actual code in worker',
    'worker codeAfterRun',
    'worker onAfterRun',
  ].join('\n'));
});

test('MicroPython + Pyodide js_modules', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (!text.startsWith('['))
      logs.push(text);
  });
  await page.goto('http://localhost:8080/tests/js-integration/js_modules.html');
  await page.waitForSelector('html.done');
  await expect(logs.length).toBe(6);
  await expect(logs[0]).toBe(logs[1]);
  await expect(logs[1]).toBe(logs[2]);
  await expect(logs[3]).toBe(logs[4]);
  await expect(logs[4]).toBe(logs[5]);
});

test('MicroPython + configURL', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/config-url.html');
  await page.waitForSelector('html.main.worker');
});

test('Pyodide + terminal on Main', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/py-terminal-main.html');
  await page.waitForSelector('html.ok');
});


test('Pyodide + terminal on Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/py-terminal-worker.html');
  await page.waitForSelector('html.ok');
});

test('Pyodide + multiple terminals via Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/py-terminals.html');
  await page.waitForSelector('html.first.second');
});

test('MicroPython + Pyodide fetch', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/fetch/index.html');
  await page.waitForSelector('html.mpy.py');
});

test('MicroPython + Pyodide ffi', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/ffi.html');
  await page.waitForSelector('html.mpy.py');
});

test('MicroPython + Storage', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/storage.html');
  await page.waitForSelector('html.ok');
});

test('MicroPython + JS Storage', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/js-storage.html');
  await page.waitForSelector('html.ok');
});

test('MicroPython + workers', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/workers/index.html');
  await page.waitForSelector('html.mpy.py');
});

test('MicroPython Editor setup error', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/issue-2093/index.html');
  await page.waitForSelector('html.errored');
});

test('MicroPython async @when listener', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/async-listener.html');
  await page.waitForSelector('html.ok');
});

test('Pyodide loader', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/js-integration/loader/index.html');
  await page.waitForSelector('html.ok');
  const body = await page.evaluate(() => document.body.textContent);
  await expect(body.includes('Loaded Pyodide')).toBe(true);
});
