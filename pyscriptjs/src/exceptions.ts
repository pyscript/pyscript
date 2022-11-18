const CLOSEBUTTON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill="currentColor" width="12px"><path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/></svg>`;

type MessageType = "text" | "html";

export enum ErrorCode {
  GENERIC = "PY0000", // Use this only for development then change to a more specific error code
  DEPRECATED = "PY0001",
  BAD_CONFIG = "PY1000",
  FETCH_ERROR = "PY2000",
  FETCH_PARAMETER_ERROR = "PY2001",
  FETCH_NAME_ERROR = "PY2002",
  // Currently these are created depending on error code received from fetching
  FETCH_NOT_FOUND_ERROR = "PY2404",
  FETCH_UNAUTHORIZED_ERROR = "PY2401",
  FETCH_FORBIDDEN_ERROR = "PY2403",
  FETCH_SERVER_ERROR = "PY2500",
  FETCH_UNAVAILABLE_ERROR = "PY2503",
}

export class UserError extends Error {
  static readonly ErrorCode = ErrorCode;
  readonly ErrorCode = UserError.ErrorCode;

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
  static readonly ErrorCode = ErrorCode;
  readonly ErrorCode = FetchError.ErrorCode;

  errorCode: ErrorCode;
  constructor(errorCode: ErrorCode, message: string) {
    super(message)
    this.name = "FetchError";
    this.errorCode = errorCode;
    this.message = `(${errorCode}): ${message}`;
  }
}

export function _createAlertBanner(
  message: string,
  level: "error" | "warning" = "error",
  messageType: MessageType = "text",
  logMessage = true) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  switch (`log-${level}-${logMessage}`) {
    case "log-error-true":
      console.error(message);
      break;
    case "log-warning-true":
      console.warn(message)
      break;
  }

  const banner = document.createElement("div")
  banner.className = `alert-banner py-${level}`

  if (messageType === "html") {
    banner.innerHTML = message;
  }
  else {
    banner.textContent = message;
  }

  if (level === "warning") {
    const closeButton = document.createElement("button");

    closeButton.id = "alert-close-button"
    closeButton.addEventListener("click", () => {
      banner.remove();
    })
    closeButton.innerHTML = CLOSEBUTTON;

    banner.appendChild(closeButton);
  }

  document.body.prepend(banner);
}
