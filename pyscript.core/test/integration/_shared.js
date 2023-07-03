'use strict';

exports.shared = {
    bootstrap: ({ expect }, baseURL) => async ({ page }) => {
        await page.goto(`${baseURL}/bootstrap.html`);
        await page.waitForSelector('html.ready');
        await page.getByRole('button').click();
        const result = await page.evaluate(() => document.body.innerText);
        await expect(result.trim()).toBe('OK');
    },

    // the `remoteBootstrap` value indicates approximately how long it takes
    // for the different / worker interpreter to bootstrap
    worker: ({ expect }, url) => async ({ page }) => {
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        await page.goto(url);
        await page.waitForSelector('html.worker.ready');
        await expect(logs.join(',')).toBe('main,thread');
    },

    workerWindow: ({ expect }, baseURL) => async ({ page }) => {
        await page.goto(`${baseURL}/worker-window.html`);
        await page.waitForSelector('html.worker.ready');
        const result = await page.evaluate(() => document.body.innerText);
        await expect(result.trim()).toBe('OK');
    },
};

exports.python = {
    bootstrap: ({ expect }, baseURL) => async ({ page }) => {
        await page.goto(`${baseURL}/bootstrap.html`);
        await page.waitForSelector('html.ready');
        const result = await page.evaluate(() => document.body.innerText);
        await expect(result.trim()).toBe('OK');
    },

    fetch: ({ expect }, url) => async ({ page }) => {
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        await page.goto(url);
        await page.waitForSelector('html.ready');
        await expect(logs.length).toBe(1);
        await expect(logs[0]).toBe('hello from A');
        const body = await page.evaluate(() => document.body.innerText);
        await expect(body.trim()).toBe('hello from A, hello from B');
    },
};
