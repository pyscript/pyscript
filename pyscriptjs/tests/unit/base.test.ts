import { jest } from '@jest/globals';

import { BaseEvalElement } from '../../src/components/base';
import { runtimeLoaded } from '../../src/stores';

customElements.define('py-base', BaseEvalElement);

describe('BaseEvalElement', () => {
    let instance: BaseEvalElement;

    beforeEach(() => {
        instance = new BaseEvalElement();
    });

    it('BaseEvalElement instantiates correctly', async () => {
        expect(instance).toBeInstanceOf(BaseEvalElement);
    });

    // TODO: This test is a bit silly, but the idea is to keep it here until we fix this
    // issue
    it("should fail with: Cannot use 'in' operator to search for 'runPythonAsync' in undefined", async () => {
        let thrownError;
        let expectedTypeError = new TypeError("Cannot use 'in' operator to search for 'run' in undefined");
        try {
            instance.runAfterRuntimeInitialized(async () => {
                return;
            });
        } catch (error) {
            thrownError = error;
        }
        expect(thrownError).toEqual(expectedTypeError);
    });

    it('runAfterRuntimeInitialized calls runtimeLoaded.subscribe', async () => {
        const mockedStore = jest.fn();
        // @ts-ignore: typescript causes the test to fail
        const mockedruntimeLoaded = jest.spyOn(runtimeLoaded, 'subscribe').mockImplementation(mockedStore);

        instance.runAfterRuntimeInitialized(async () => {});

        expect(mockedruntimeLoaded).toHaveBeenCalled();
    });

    it('addToOutput sets outputElements property correctly', async () => {
        instance.outputElement = document.createElement('body');
        instance.addToOutput('Hello, world!');

        expect(instance.outputElement.innerHTML).toBe('<div>Hello, world!</div>');
        expect(instance.outputElement.hidden).toBe(false);

        instance.addToOutput('Have a good day!');
        expect(instance.outputElement.innerHTML).toBe('<div>Hello, world!</div><div>Have a good day!</div>');
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
