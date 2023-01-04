import { FetchError, ErrorCode } from './exceptions';

export async function robustFetch(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);
    // Note that response.ok is true for 200-299 responses
    if (!response.ok) {
        const errorMsg = `Fetching from URL ${url} failed with error ${response.status} (${response.statusText}).`;
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
