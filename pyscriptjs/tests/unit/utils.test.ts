import { beforeEach, expect, describe, it } from "@jest/globals"
import { ensureUniqueId, joinPaths, createSingularWarning} from "../../src/utils"

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

describe("JoinPaths", () => {
  it("should remove trailing slashes from the beginning and the end", () => {
    const paths: string[] = ['///abc/d/e///'];
    const joinedPath = joinPaths(paths);
    expect(joinedPath).toStrictEqual('/abc/d/e');
  })

  it("should not remove slashes from the middle to preserve protocols such as http", () => {
    const paths: string[] = ['http://google.com', '///data.txt'];
    const joinedPath = joinPaths(paths);
    expect(joinedPath).toStrictEqual('http://google.com/data.txt');
  })

  it("should not join paths when they are empty strings", () => {
    const paths: string[] = ['', '///hhh/ll/pp///', '', 'kkk'];
    const joinedPath = joinPaths(paths);
    expect(joinedPath).toStrictEqual('hhh/ll/pp/kkk');
  })

describe("createSingularBanner", () => {
    it("should create one and new banner containing the sentinel text, and not duplicate it", () => {
      //One warning banner with the desired text should be created
      createSingularWarning("A unique error message", "unique")
      expect(document.getElementsByClassName("alert-banner")?.length).toEqual(1)
      expect(document.getElementsByClassName("alert-banner")[0].textContent).toEqual(expect.stringContaining("A unique error message"))

      //Should still only be one banner, since the second uses the existing sentinel value "unique"
      createSingularWarning("This banner should not appear", "unique")
      expect(document.getElementsByClassName("alert-banner")?.length).toEqual(1)
      expect(document.getElementsByClassName("alert-banner")[0].textContent).toEqual(expect.stringContaining("A unique error message"))

      //If the sentinel value is not provided, the entire msg is used as the sentinel
      createSingularWarning("A unique error message", null)
      expect(document.getElementsByClassName("alert-banner")?.length).toEqual(1)
      expect(document.getElementsByClassName("alert-banner")[0].textContent).toEqual(expect.stringContaining("A unique error message"))
    })
  })
})
