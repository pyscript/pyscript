'use strict';

const { TextEncoder, TextDecoder } = require('util');
const { MessageChannel } = require('node:worker_threads');

const { default: $JSDOMEnvironment, TestEnvironment } = require('jest-environment-jsdom');

Object.defineProperty(exports, '__esModule', {
    value: true,
});

class JSDOMEnvironment extends $JSDOMEnvironment {
    constructor(...args) {
        const { global } = super(...args);
        if (!global.TextEncoder) {
            global.TextEncoder = TextEncoder;
        }
        if (!global.TextDecoder) {
            global.TextDecoder = TextDecoder;
        }
        if (!global.MessageChannel) {
            global.MessageChannel = MessageChannel;
        }
    }
}

exports.default = JSDOMEnvironment;
exports.TestEnvironment = TestEnvironment === $JSDOMEnvironment ? JSDOMEnvironment : TestEnvironment;
