import { test, expect } from '@playwright/test';

test('MicroPython display', async ({ page }) => {
  await page.goto('http://localhost:8080/test/mpy.html');
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
  await page.goto('http://localhost:8080/test/hooks.html');
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
