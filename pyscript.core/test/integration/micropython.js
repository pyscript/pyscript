'use strict';

const { shared, python } = require('./_shared.js');

module.exports = (playwright, baseURL) => {
    const { test } = playwright;

    test('MicroPython bootstrap', python.bootstrap(playwright, baseURL));

    test('MicroPython fetch', python.fetch(playwright, `${baseURL}/fetch.html`));

    test('MicroPython to MicroPython Worker', shared.worker(playwright, `${baseURL}/worker.html`));

    test('MicroPython Worker window', shared.workerWindow(playwright, baseURL));

    test('MicroPython to Wasmoon Worker', shared.worker(playwright, `${baseURL}/worker-lua.html`));
};
