import { CLOSEBUTTON } from "./consts"
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

export function _createAlertBanner(message: string, level: "error" | "warning" = "error", logMessage = true) {
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
  banner.innerHTML = message

  if (level === "warning") {
    const closeButton = document.createElement("button")

    closeButton.id = "alert-close-button"
    closeButton.addEventListener("click", () => {
      banner.remove()
    })
    closeButton.innerHTML = CLOSEBUTTON

    banner.appendChild(closeButton)
  }

  document.body.prepend(banner)
}
