<<<<<<< HEAD
import { ensureUniqueId, joinPaths } from '../../src/utils';
import { expect } from "@jest/globals";
=======
import { jest } from "@jest/globals"
import { ensureUniqueId, _createAlertBanner } from "../../src/utils"
>>>>>>> f90a48a... Add tests for alertBanner

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

<<<<<<< HEAD
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
=======
describe("Test _createAlertBanner", () => {
  document.body.innerHTML = `<div>Hello World</div>`

  beforeEach(() => {
    const banners = document.getElementsByClassName("alert-banner")
    for (let banner of banners) {
      banner.remove()
    }
  })

  it("error level shouldn't contain close button", async () => {
    _createAlertBanner("Something went wrong!", "error")

    const banner = document.getElementsByClassName("alert-banner")
    const closeButton = document.getElementById("alert-close-button")
    console.log(banner)
    expect(banner.length).toBe(1)
    expect(banner[0].innerHTML).toBe("Something went wrong!")
    expect(closeButton).toBeNull()
  })

  it("warning level should contain close button", async () => {
    _createAlertBanner("This is a warning", "warning")

    const banner = document.getElementsByClassName("alert-banner")
    const closeButton = document.getElementById("alert-close-button")
    console.log(banner)
    expect(banner.length).toBe(1)
    expect(banner[0].innerHTML).toContain("This is a warning")
    expect(closeButton).not.toBeNull()
  })

  it("error level banner should log to console", async () => {
    const logSpy = jest.spyOn(console, "error")

    _createAlertBanner("Something went wrong!")

    expect(logSpy).toHaveBeenCalledWith("Something went wrong!")

  })

  it("warning level banner should log to console", async () => {
    const logSpy = jest.spyOn(console, "warn")

    _createAlertBanner("This warning", "warning")

    expect(logSpy).toHaveBeenCalledWith("This warning")
  })

  it("close button should remove element from page", async () => {
    let banner = document.getElementsByClassName("alert-banner")
    expect(banner.length).toBe(0)

    _createAlertBanner("Warning!", "warning")

    // Just a sanity check
    banner = document.getElementsByClassName("alert-banner")
    expect(banner.length).toBe(1)

    const closeButton = document.getElementById("alert-close-button")

    closeButton.click()

    // Confirm that clicking the close button, removes the element
    banner = document.getElementsByClassName("alert-banner")
    expect(banner.length).toBe(0)
  })

  it("toggling logging off shouldn't log to console", async () => {
    const errorLogSpy = jest.spyOn(console, "error")
    const warnLogSpy = jest.spyOn(console, "warn")

    _createAlertBanner("Test error", "error", false)
    expect(errorLogSpy).not.toHaveBeenCalledWith("Test error")

    _createAlertBanner("Test warning", "warning", false)
    expect(warnLogSpy).not.toHaveBeenCalledWith("Test warning")
>>>>>>> f90a48a... Add tests for alertBanner
  })
})
