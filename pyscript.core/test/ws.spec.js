import { test, expect } from '@playwright/test';

test('MicroPython WebSocket', async ({ page }) => {
  await page.goto('http://localhost:5037/');
  await page.waitForSelector('html.ok');
});
