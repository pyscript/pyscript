import { FetchError, ErrorCode } from './exceptions';

/**
 * This is a fetch wrapper that handles any non 200 responses and throws a
 * FetchError with the right ErrorCode. This is useful because our FetchError
 * will automatically create an alert banner.
 *
 * @param url - URL to fetch
 * @param options - options to pass to fetch
 * @returns Response
 */
export async function robustFetch(url: string, options?: RequestInit): Promise<Response> {
    let response: Response;

    // Note: We need to wrap fetch into a try/catch block because fetch
    // throws a TypeError if the URL is invalid such as http://blah.blah
    try {
        response = await fetch(url, options);
    } catch (err) {
        const error = err as Error;
        let errMsg: string;
        if (url.startsWith('http')) {
            errMsg =
                `Fetching from URL ${url} failed with error ` +
                `'${error.message}'. Are your filename and path correct?`;
        } else {
            errMsg = `PyScript: Access to local files
        (using "Paths:" in &lt;py-config&gt;)
        is not available when directly opening a HTML file;
        you must use a webserver to serve the additional files.
        See <a style="text-decoration: underline;" href="https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062">this reference</a>
        on starting a simple webserver with Python.
            `;
        }
        throw new FetchError(ErrorCode.FETCH_ERROR, errMsg);
    }

    // Note that response.ok is true for 200-299 responses
    if (!response.ok) {
        const errorMsg = `Fetching from URL ${url} failed with error ${response.status} (${response.statusText}). Are your filename and path correct?`;
        switch (response.status) {
            case 404:
                throw new FetchError(ErrorCode.FETCH_NOT_FOUND_ERROR, errorMsg);
            case 401:
                throw new FetchError(ErrorCode.FETCH_UNAUTHORIZED_ERROR, errorMsg);
            case 403:
                throw new FetchError(ErrorCode.FETCH_FORBIDDEN_ERROR, errorMsg);
            case 500:
                throw new FetchError(ErrorCode.FETCH_SERVER_ERROR, errorMsg);
            case 503:
                throw new FetchError(ErrorCode.FETCH_UNAVAILABLE_ERROR, errorMsg);
            default:
                throw new FetchError(ErrorCode.FETCH_ERROR, errorMsg);
        }
    }
    return response;
}
