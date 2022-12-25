import { FetchError, ErrorCode } from "./exceptions";


/*
    This is a fetch wrapper that handles any non 200 response and throws a FetchError
    with the right ErrorCode.
    TODO: Should we only throw on 4xx and 5xx responses?
*/
export async function robustFetch(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);
    // Note that response.ok is true for 200-299 responses
    if (!response.ok) {
        const errorMsg = `Fetching from URL ${url} failed with error ${response.status} (${response.statusText}).`;
        const generateError = (error: ErrorCode) => new FetchError(error, errorMsg);

        switch(response.status) {
            case 404:
                throw generateError(ErrorCode.FETCH_NOT_FOUND_ERROR);
            case 401:
                throw generateError(ErrorCode.FETCH_UNAUTHORIZED_ERROR);
            case 403:
                throw generateError(ErrorCode.FETCH_FORBIDDEN_ERROR);
            case 500:
                throw generateError(ErrorCode.FETCH_SERVER_ERROR);
            case 503:
                throw generateError(ErrorCode.FETCH_UNAVAILABLE_ERROR);
            default:
                throw generateError(ErrorCode.FETCH_ERROR);
        }
    }
    return response
}
