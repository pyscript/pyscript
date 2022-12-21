const CLOSEBUTTON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill="currentColor" width="12px"><path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/></svg>`;

type MessageType = 'text' | 'html';

/*
These error codes are used to identify the type of error that occurred.
The convention is:
* PY0 - errors that occur when fetching
* PY1 - errors that occur in config
* PY9 - Deprecation errors
*/

export enum ErrorCode {
  GENERIC = "PY0000", // Use this only for development then change to a more specific error code
  FETCH_ERROR = "PY0001",
  FETCH_NAME_ERROR = "PY0002",
  // Currently these are created depending on error code received from fetching
  FETCH_UNAUTHORIZED_ERROR = "PY0401",
  FETCH_FORBIDDEN_ERROR = "PY0403",
  FETCH_NOT_FOUND_ERROR = "PY0404",
  FETCH_SERVER_ERROR = "PY0500",
  FETCH_UNAVAILABLE_ERROR = "PY0503",
  BAD_CONFIG = "PY1000",
  MICROPIP_INSTALL_ERROR = "PY1001",
  BAD_PLUGIN_FILE_EXTENSION = "PY1002",
  TOP_LEVEL_AWAIT = "PY9000"
}

export class UserError extends Error {
  messageType: MessageType;
  errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string, t: MessageType = "text") {
    super(message);
    this.errorCode = errorCode;
    this.name = "UserError";
    this.messageType = t;
    this.message = `(${errorCode}): ${message}`;
  }
}


export class FetchError extends Error {
  errorCode: ErrorCode;
  constructor(errorCode: ErrorCode, message: string) {
    super(message)
    this.name = "FetchError";
    this.errorCode = errorCode;
    this.message = `(${errorCode}): ${message}`;
  }
}


export class InstallError extends UserError {
  errorCode: ErrorCode;
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message)
    this.name = "InstallError";
  }
}

export function _createAlertBanner(
    message: string,
    level: 'error' | 'warning' = 'error',
    messageType: MessageType = 'text',
    logMessage = true,
) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    switch (`log-${level}-${logMessage}`) {
        case 'log-error-true':
            console.error(message);
            break;
        case 'log-warning-true':
            console.warn(message);
            break;
    }

    const banner = document.createElement('div');
    banner.className = `alert-banner py-${level}`;

    if (messageType === 'html') {
        banner.innerHTML = message;
    } else {
        banner.textContent = message;
    }

    if (level === 'warning') {
        const closeButton = document.createElement('button');

        closeButton.id = 'alert-close-button';
        closeButton.addEventListener('click', () => {
            banner.remove();
        });
        closeButton.innerHTML = CLOSEBUTTON;

        banner.appendChild(closeButton);
    }

    document.body.prepend(banner);
}
