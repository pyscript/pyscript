import { jest } from "@jest/globals"
import { ensureUniqueId } from "../../src/utils"

describe("Utils", () => {

  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("div");
  })

  it("ensureUniqueId sets unique id on element", async () => {
    expect(element.id).toBe("")

    ensureUniqueId(element)

    expect(element.id).toBe("py-internal-0")
  })

  it("ensureUniqueId sets unique id with increasing counter", async () => {
    const secondElement = document.createElement("div")

    expect(element.id).toBe("")
    expect(secondElement.id).toBe("")

    ensureUniqueId(element)
    ensureUniqueId(secondElement)

    // The counter will have been incremented on
    // the previous test, make sure it keeps increasing
    expect(element.id).toBe("py-internal-1")
    expect(secondElement.id).toBe("py-internal-2")
  })
})
