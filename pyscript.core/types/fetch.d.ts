/**
 * This is a fetch wrapper that handles any non 200 responses and throws a
 * FetchError with the right ErrorCode. This is useful because our FetchError
 * will automatically create an alert banner.
 *
 * @param {string} url - URL to fetch
 * @param {Request} [options] - options to pass to fetch
 * @returns {Promise<Response>}
 */
export function robustFetch(url: string, options?: Request): Promise<Response>;
export { getText };
import { getText } from "polyscript/exports";
