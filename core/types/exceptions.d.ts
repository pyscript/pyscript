/**
 * Internal function for creating alert banners on the page
 * @param {string} message The message to be displayed to the user
 * @param {string} level The alert level of the message. Can be any string; 'error' or 'warning' cause matching messages to be emitted to the console
 * @param {string} [messageType="text"] If set to "html", the message content will be assigned to the banner's innerHTML directly, instead of its textContent
 * @param {any} [logMessage=true] An additional flag for whether the message should be sent to the console log.
 */
export function _createAlertBanner(message: string, level: string, messageType?: string, logMessage?: any): void;
export namespace ErrorCode {
    let GENERIC: string;
    let CONFLICTING_CODE: string;
    let BAD_CONFIG: string;
    let MICROPIP_INSTALL_ERROR: string;
    let BAD_PLUGIN_FILE_EXTENSION: string;
    let NO_DEFAULT_EXPORT: string;
    let TOP_LEVEL_AWAIT: string;
    let FETCH_ERROR: string;
    let FETCH_NAME_ERROR: string;
    let FETCH_UNAUTHORIZED_ERROR: string;
    let FETCH_FORBIDDEN_ERROR: string;
    let FETCH_NOT_FOUND_ERROR: string;
    let FETCH_SERVER_ERROR: string;
    let FETCH_UNAVAILABLE_ERROR: string;
}
/**
 * Keys of the ErrorCode object
 * @typedef {keyof ErrorCode} ErrorCodes
 * */
export class UserError extends Error {
    /**
     * @param {ErrorCodes} errorCode
     * @param {string} message
     * @param {string} messageType
     * */
    constructor(errorCode: ErrorCodes, message?: string, messageType?: string);
    errorCode: "GENERIC" | "CONFLICTING_CODE" | "BAD_CONFIG" | "MICROPIP_INSTALL_ERROR" | "BAD_PLUGIN_FILE_EXTENSION" | "NO_DEFAULT_EXPORT" | "TOP_LEVEL_AWAIT" | "FETCH_ERROR" | "FETCH_NAME_ERROR" | "FETCH_UNAUTHORIZED_ERROR" | "FETCH_FORBIDDEN_ERROR" | "FETCH_NOT_FOUND_ERROR" | "FETCH_SERVER_ERROR" | "FETCH_UNAVAILABLE_ERROR";
    messageType: string;
}
export class FetchError extends UserError {
    /**
     * @param {ErrorCodes} errorCode
     * @param {string} message
     * */
    constructor(errorCode: ErrorCodes, message: string);
}
export class InstallError extends UserError {
    /**
     * @param {ErrorCodes} errorCode
     * @param {string} message
     * */
    constructor(errorCode: ErrorCodes, message: string);
}
/**
 * Keys of the ErrorCode object
 */
export type ErrorCodes = "GENERIC" | "CONFLICTING_CODE" | "BAD_CONFIG" | "MICROPIP_INSTALL_ERROR" | "BAD_PLUGIN_FILE_EXTENSION" | "NO_DEFAULT_EXPORT" | "TOP_LEVEL_AWAIT" | "FETCH_ERROR" | "FETCH_NAME_ERROR" | "FETCH_UNAUTHORIZED_ERROR" | "FETCH_FORBIDDEN_ERROR" | "FETCH_NOT_FOUND_ERROR" | "FETCH_SERVER_ERROR" | "FETCH_UNAVAILABLE_ERROR";
