const CLOSEBUTTON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill="currentColor" width="12px"><path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/></svg>`;

export class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserError"
  }
}

export class FetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FetchError"
  }
}

export function _createAlertBanner(
  message: string,
  level: "error" | "warning" = "error",
  messageType: "text" | "html" = "text",
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

/*
* This function is used to handle UserError, if we see an error of this
* type, we will automatically create a banner on the page that will tell
* the user what went wrong. Note that the error will still stop execution,
* any other errors we will simply throw them and no banner will be shown.
*/
export function withUserErrorHandler(fn) {
  try {
    return fn();
  } catch (error: unknown) {
    if (error instanceof UserError) {
      /*
      *  Display a page-wide error message to show that something has gone wrong with
      *  PyScript or Pyodide during loading. Probably not be used for issues that occur within
      *  Python scripts, since stderr can be routed to somewhere in the DOM
      */
      _createAlertBanner(error.message);
    }
    else {
      throw error;
    }
  }
}
