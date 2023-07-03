'use strict';

const { shared, python } = require('./_shared.js');

module.exports = (playwright, baseURL) => {
    const { expect, test } = playwright;

    test('Pyodide bootstrap', python.bootstrap(playwright, baseURL));

    test('Pyodide fetch', python.fetch(playwright, `${baseURL}/fetch.html`));

    test('Pyodide to Pyodide Worker', shared.worker(playwright, `${baseURL}/worker.html`));

    test('Pyodide sync (time)', async ({ page }) => {
        const logs = [];
        page.on('console', msg => logs.push({text: msg.text(), time: new Date}));
        await page.goto(`${baseURL}/sync.html`);
        await page.waitForSelector('html.worker.ready');
        await expect(logs.length).toBe(2);
        const [
            {text: text1, time: time1},
            {text: text2, time: time2}
        ] = logs;
        await expect(text1).toBe('before');
        await expect(text2).toBe('after');
        await expect((time2 - time1) >= 1000).toBe(true);
    });
};
