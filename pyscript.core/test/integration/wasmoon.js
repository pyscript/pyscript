'use strict';

const { shared } = require('./_shared.js');

module.exports = (playwright, baseURL) => {
    const { test } = playwright;

    test('Wasmoon bootstrap', shared.bootstrap(playwright, baseURL));

    test('Wasmoon to Wasmoon Worker', shared.worker(playwright, `${baseURL}/worker.html`));
};
