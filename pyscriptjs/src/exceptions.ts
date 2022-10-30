import { createAlertBanner} from "./utils"


export class UserError extends Error {
  constructor(message: string, showBanner =false) {
    super(message)
    this.name = "UserError"
    if (showBanner) {
      createAlertBanner(message, "error")
    }
  }
}
