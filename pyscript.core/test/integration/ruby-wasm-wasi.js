'use strict';

const { shared } = require('./_shared.js');

module.exports = (playwright, baseURL) => {
    const { test } = playwright;

    test('Ruby WASM WASI bootstrap', shared.bootstrap(playwright, baseURL));
};
