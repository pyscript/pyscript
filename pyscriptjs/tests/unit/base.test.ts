import { jest } from '@jest/globals';

import { BaseEvalElement } from '../../src/components/base';

customElements.define('py-base', BaseEvalElement);

describe('BaseEvalElement', () => {
    let instance: BaseEvalElement;

    beforeEach(() => {
        instance = new BaseEvalElement();
    });

    it('BaseEvalElement instantiates correctly', async () => {
        expect(instance).toBeInstanceOf(BaseEvalElement);
    });

    it('setOutputMode updates appendOutput property correctly', async () => {
        // Confirm that the default mode is 'append'
        expect(instance.appendOutput).toBe(true);

        instance.setAttribute('output-mode', 'replace');
        instance.setOutputMode();

        expect(instance.appendOutput).toBe(false);

        // Using a custom output-mode shouldn't update mode
        instance.setAttribute('output-mode', 'custom');
        instance.setOutputMode();
        expect(instance.appendOutput).toBe(false);
    });

    it('preEvaluate returns null since subclasses should overwrite it', async () => {
        const preEvaluateResult = instance.preEvaluate();
        expect(preEvaluateResult).toBeNull();
    });

    it('postEvaluate returns null since subclasses should overwrite it', async () => {
        const preEvaluateResult = instance.postEvaluate();
        expect(preEvaluateResult).toBeNull();
    });

    it('checkId generates id if none exists', async () => {
        // Test default value
        expect(instance.id).toBe('');

        instance.checkId();

        // expect id is similar to py-78c3e696-a74f-df40-f82c-535f12c484ae
        expect(instance.id).toMatch(/py-(\w+-){1,4}\w+/);
    });

    it('getSourceFromElement returns empty string', async () => {
        const returnedGetSourceFromElement = instance.getSourceFromElement();
        expect(returnedGetSourceFromElement).toBe('');
    });
});
