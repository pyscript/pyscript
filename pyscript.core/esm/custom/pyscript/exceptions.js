const CLOSEBUTTON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill="currentColor" width="12px"><path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/></svg>`;

/**
 * These error codes are used to identify the type of error that occurred.
 * @see https://docs.pyscript.net/latest/reference/exceptions.html?highlight=errors
 */
export const ErrorCode = {
    GENERIC: "PY0000", // Use this only for development then change to a more specific error code
    FETCH_ERROR: "PY0001",
    FETCH_NAME_ERROR: "PY0002",
    // Currently these are created depending on error code received from fetching
    FETCH_UNAUTHORIZED_ERROR: "PY0401",
    FETCH_FORBIDDEN_ERROR: "PY0403",
    FETCH_NOT_FOUND_ERROR: "PY0404",
    FETCH_SERVER_ERROR: "PY0500",
    FETCH_UNAVAILABLE_ERROR: "PY0503",
    BAD_CONFIG: "PY1000",
    MICROPIP_INSTALL_ERROR: "PY1001",
    BAD_PLUGIN_FILE_EXTENSION: "PY2000",
    NO_DEFAULT_EXPORT: "PY2001",
    TOP_LEVEL_AWAIT: "PY9000",
};

export class UserError extends Error {
    constructor(errorCode, message = "", messageType = "text") {
        super(`(${errorCode}): ${message}`);
        this.errorCode = errorCode;
        this.messageType = messageType;
        this.name = "UserError";
    }
}

export class FetchError extends UserError {
    constructor(errorCode, message) {
        super(errorCode, message);
        this.name = "FetchError";
    }
}

export class InstallError extends UserError {
    constructor(errorCode, message) {
        super(errorCode, message);
        this.name = "InstallError";
    }
}

export function _createAlertBanner(
    message,
    level,
    messageType = "text",
    logMessage = true,
) {
    switch (`log-${level}-${logMessage}`) {
        case "log-error-true":
            console.error(message);
            break;
        case "log-warning-true":
            console.warn(message);
            break;
    }

    const content = messageType === "html" ? "innerHTML" : "textContent";
    const banner = Object.assign(document.createElement("div"), {
        className: `alert-banner py-${level}`,
        [content]: message,
    });

    if (level === "warning") {
        const closeButton = Object.assign(document.createElement("button"), {
            id: "alert-close-button",
            innerHTML: CLOSEBUTTON,
        });

        banner.appendChild(closeButton).addEventListener("click", () => {
            banner.remove();
        });
    }

    document.body.prepend(banner);
}
