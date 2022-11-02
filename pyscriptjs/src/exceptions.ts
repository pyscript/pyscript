import { _createAlertBanner } from "./utils"


export class UserError extends Error {
  showBanner: boolean
  constructor(message: string, showBanner = true) {
    super(message)
    this.name = "UserError"
    this.showBanner = showBanner
  }
}
