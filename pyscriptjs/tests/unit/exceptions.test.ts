import { expect, it, jest } from "@jest/globals"
import { _createAlertBanner, UserError } from "../../src/exceptions"

describe("Test _createAlertBanner", () => {

  afterEach(() => {
    // Ensure we always have a clean body
    document.body.innerHTML = `<div>Hello World</div>`;
  })


  it("error level shouldn't contain close button", async () => {
    _createAlertBanner("Something went wrong!", "error");

    const banner = document.getElementsByClassName("alert-banner");
    const closeButton = document.getElementById("alert-close-button");
    expect(banner.length).toBe(1);
    expect(banner[0].innerHTML).toBe("Something went wrong!");
    expect(closeButton).toBeNull();
  })

  it("warning level should contain close button", async () => {
    _createAlertBanner("This is a warning", "warning");

    const banner = document.getElementsByClassName("alert-banner");
    const closeButton = document.getElementById("alert-close-button");
    expect(banner.length).toBe(1);
    expect(banner[0].innerHTML).toContain("This is a warning");
    expect(closeButton).not.toBeNull();
  })

  it("error level banner should log to console", async () => {
    const logSpy = jest.spyOn(console, "error");

    _createAlertBanner("Something went wrong!");

    expect(logSpy).toHaveBeenCalledWith("Something went wrong!");

  })

  it("warning level banner should log to console", async () => {
    const logSpy = jest.spyOn(console, "warn");

    _createAlertBanner("This warning", "warning");

    expect(logSpy).toHaveBeenCalledWith("This warning");
  })

  it("close button should remove element from page", async () => {
    let banner = document.getElementsByClassName("alert-banner");
    expect(banner.length).toBe(0);

    _createAlertBanner("Warning!", "warning");

    // Just a sanity check
    banner = document.getElementsByClassName("alert-banner");
    expect(banner.length).toBe(1);

    const closeButton = document.getElementById("alert-close-button");
    if(closeButton) {
      closeButton.click();
      // Confirm that clicking the close button, removes the element
      banner = document.getElementsByClassName("alert-banner");
      expect(banner.length).toBe(0);
    } else {
      fail("Unable to find close button on the page, but should exist");
    }

  })

  it("toggling logging off on error alert shouldn't log to console", async () => {
    const errorLogSpy = jest.spyOn(console, "error");

    _createAlertBanner("Test error", "error", "text", false);
    expect(errorLogSpy).not.toHaveBeenCalledWith("Test error");
  })

  it("toggling logging off on warning alert shouldn't log to console", async () => {
    const warnLogSpy = jest.spyOn(console, "warn");
    _createAlertBanner("Test warning", "warning", "text", false);
    expect(warnLogSpy).not.toHaveBeenCalledWith("Test warning");
  })


  it('_createAlertbanner messageType text writes message to content', async () => {
    let banner = document.getElementsByClassName("alert-banner");
    expect(banner.length).toBe(0);

    const message = '<p>Test message</p>'
    _createAlertBanner(message, 'error', 'text');
    banner = document.getElementsByClassName("alert-banner");

    expect(banner.length).toBe(1);
    expect(banner[0].innerHTML).toBe("&lt;p&gt;Test message&lt;/p&gt;");
    expect(banner[0].textContent).toBe(message);
  })

  it('_createAlertbanner messageType html writes message to innerHTML', async () => {
    let banner = document.getElementsByClassName("alert-banner");
    expect(banner.length).toBe(0);

    const message = '<p>Test message</p>';
    _createAlertBanner(message, 'error', 'html');
    banner = document.getElementsByClassName("alert-banner");

    expect(banner.length).toBe(1);
    expect(banner[0].innerHTML).toBe(message);
    expect(banner[0].textContent).toBe("Test message");
  })
})
