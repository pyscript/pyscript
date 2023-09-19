export function _createAlertBanner(message: any, level: any, messageType?: string, logMessage?: boolean): void;
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
export class UserError extends Error {
    constructor(errorCode: any, message?: string, messageType?: string);
    errorCode: any;
    messageType: string;
}
export class FetchError extends UserError {
    constructor(errorCode: any, message: any);
}
export class InstallError extends UserError {
    constructor(errorCode: any, message: any);
}
