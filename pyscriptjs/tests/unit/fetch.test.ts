import { describe, it, expect, jest } from '@jest/globals';
import { FetchError, ErrorCode } from '../../src/exceptions';
import { robustFetch } from '../../src/fetch';
import { Response } from 'node-fetch';

describe('robustFetch', () => {
    it('should return a response object', async () => {
        global.fetch = jest.fn(() => Promise.resolve(new Response((status = '200'), 'Hello World')));

        const response = await robustFetch('https://pyscript.net');
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
    });

    it('receiving a 404 when fetching should throw FetchError with the right errorCode', async () => {
        global.fetch = jest.fn(() => Promise.resolve(new Response('Not Found', { status: 404 })));

        const url = 'https://pyscript.net/non-existent-page';
        const expectedError = new FetchError(
            ErrorCode.FETCH_NOT_FOUND_ERROR,
            `Fetching from URL ${url} failed with error 404 (Not Found). ` + `Are your filename and path correct?`,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });

    it('receiving a 401 when fetching should throw FetchError with the right errorCode', async () => {
        global.fetch = jest.fn(() => Promise.resolve(new Response('', { status: 401 })));

        const url = 'https://pyscript.net/protected-page';
        const expectedError = new FetchError(
            ErrorCode.FETCH_UNAUTHORIZED_ERROR,
            `Fetching from URL ${url} failed with error 401 (Unauthorized). ` + `Are your filename and path correct?`,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });

    it('receiving a 403 when fetching should throw FetchError with the right errorCode', async () => {
        global.fetch = jest.fn(() => Promise.resolve(new Response('', { status: 403 })));

        const url = 'https://pyscript.net/secret-page';
        const expectedError = new FetchError(
            ErrorCode.FETCH_FORBIDDEN_ERROR,
            `Fetching from URL ${url} failed with error 403 (Forbidden). ` + `Are your filename and path correct?`,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });

    it('receiving a 500 when fetching should throw FetchError with the right errorCode', async () => {
        global.fetch = jest.fn(() => Promise.resolve(new Response('Not Found', { status: 500 })));

        const url = 'https://pyscript.net/protected-page';
        const expectedError = new FetchError(
            ErrorCode.FETCH_SERVER_ERROR,
            `Fetching from URL ${url} failed with error 500 (Internal Server Error). ` +
                `Are your filename and path correct?`,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });

    it('receiving a 503 when fetching should throw FetchError with the right errorCode', async () => {
        global.fetch = jest.fn(() => Promise.resolve(new Response('Not Found', { status: 503 })));

        const url = 'https://pyscript.net/protected-page';
        const expectedError = new FetchError(
            ErrorCode.FETCH_UNAVAILABLE_ERROR,
            `Fetching from URL ${url} failed with error 503 (Service Unavailable). ` +
                `Are your filename and path correct?`,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });

    it('handle TypeError when using a bad url', async () => {
        global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));

        const url = 'https://pyscript.net/protected-page';
        const expectedError = new FetchError(
            ErrorCode.FETCH_ERROR,
            `Fetching from URL ${url} failed with error 'Failed to fetch'. Are your filename and path correct?`,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });

    it('handle failed to fetch when using local file', async () => {
        global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));

        const url = './my-awesome-pyscript.py';

        const expectedError = new FetchError(
            ErrorCode.FETCH_ERROR,
            `PyScript: Access to local files
        (using "Paths:" in &lt;py-config&gt;)
        is not available when directly opening a HTML file;
        you must use a webserver to serve the additional files.
        See <a style="text-decoration: underline;" href="https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062">this reference</a>
        on starting a simple webserver with Python.
            `,
        );

        expect(() => robustFetch(url)).rejects.toThrow(expectedError);
    });
});
