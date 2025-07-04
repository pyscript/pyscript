import { test, expect } from '@playwright/test';

test.setTimeout(120 * 1000);

test('MicroPython display', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/mpy.html');
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
  await page.goto('http://localhost:8080/tests/javascript/hooks.html');
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
  await page.goto('http://localhost:8080/tests/javascript/js_modules.html');
  await page.waitForSelector('html.done');
  await expect(logs.length).toBe(6);
  await expect(logs[0]).toBe(logs[1]);
  await expect(logs[1]).toBe(logs[2]);
  await expect(logs[3]).toBe(logs[4]);
  await expect(logs[4]).toBe(logs[5]);
});

test('MicroPython + configURL', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/config-url.html');
  await page.waitForSelector('html.main.worker');
});

test('MicroPython + Symbols', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/worker-symbols.html');
  await page.waitForSelector('html.main.worker');
});

test('Pyodide + terminal on Main', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/py-terminal-main.html');
  await page.waitForSelector('html.ok');
});


test('Pyodide + terminal on Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/py-terminal-worker.html');
  await page.waitForSelector('html.ok');
});

test('Pyodide + multiple terminals via Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/py-terminals.html');
  await page.waitForSelector('html.first.second');
});

test('MicroPython + Pyodide fetch', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/fetch/index.html');
  await page.waitForSelector('html.mpy.py');
});

test('MicroPython + Pyodide ffi', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/ffi.html');
  await page.waitForSelector('html.mpy.py');
});

test('MicroPython + Storage', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/storage.html');
  await page.waitForSelector('html.ok');
});

test('MicroPython + JS Storage', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/js-storage.html');
  await page.waitForSelector('html.ok');
});

test('MicroPython using named Pyodide Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/workers/mpy/index.html');
  await page.waitForSelector('html.pyodide_version');
});

test('MicroPython creating a named Pyodide Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/workers/create_named/index.html');
  await page.waitForSelector('html.pyodide_version');
});

test('Pyodide using named MicroPython Worker', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/workers/py/index.html');
  await page.waitForSelector('html.micropython_version');
});

test('MicroPython Editor setup error', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/issue-2093/index.html');
  await page.waitForSelector('html.errored');
});

test('MicroPython async @when listener', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/async-listener.html');
  await page.waitForSelector('html.ok');
});

test('Pyodide loader', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/loader/index.html');
  await page.waitForSelector('html.ok');
  const body = await page.evaluate(() => document.body.textContent);
  await expect(body.includes('Loaded Pyodide')).toBe(true);
});

test('Py and Mpy config["type"]', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/config_type.html');
  await page.waitForSelector('html.mpy.py');
});

test('Pyodide lockFileURL vs CDN', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/pyodide-cache/');
  await page.waitForSelector('html.done');
  const body = await page.evaluate(() => document.body.textContent);
  await expect(body).toBe('OK');
});

test('Pyodide pinned lockFileURL', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (!text.startsWith('['))
      logs.push(text);
  });
  await page.goto('http://localhost:8080/tests/javascript/pyodide-lockfile/');
  await page.waitForSelector('html.done');
  let body = await page.evaluate(() => document.body.lastChild.textContent);
  await expect(body).toBe('OK');
  await expect(!!logs.splice(0).length).toBe(true);
  await page.reload();
  await page.waitForSelector('html.done');
  body = await page.evaluate(() => document.body.lastChild.textContent);
  await expect(body).toBe('OK');
  await expect(logs.splice(0).length).toBe(0);
});

test('MicroPython buffered error', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/mpy-error.html');
  await page.waitForSelector('html.ok');
  const body = await page.evaluate(() => document.body.textContent.trim());
  await expect(body).toBe('This is an error');
});

test('MicroPython buffered NO error', async ({ page }) => {
  await page.goto('http://localhost:8080/tests/javascript/mpy-no-error.html');
  await page.waitForSelector('html.ok');
  const body = await page.evaluate(() => document.body.textContent.trim());
  await expect(body).toBe('');
});

test('Pyodide media module', async ({ page }) => {
  await page.context().grantPermissions(['camera', 'microphone']);
  await page.context().addInitScript(() => {
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
    navigator.mediaDevices.enumerateDevices = async function() {
      const realDevices = await originalEnumerateDevices.call(this);
      if (!realDevices || realDevices.length === 0) {
        return [
          { deviceId: 'camera1', groupId: 'group1', kind: 'videoinput', label: 'Simulated Camera' },
          { deviceId: 'mic1', groupId: 'group2', kind: 'audioinput', label: 'Simulated Microphone' }
        ];
      }
      return realDevices;
    };
  });
  await page.goto('http://localhost:8080/tests/javascript/media.html');
  await page.waitForSelector('html.media-ok', { timeout: 10000 });
  const isSuccess = await page.evaluate(() => document.documentElement.classList.contains('media-ok'));
  expect(isSuccess).toBe(true);
});
