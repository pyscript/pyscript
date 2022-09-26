import { jest } from "@jest/globals";

import { PyTitle } from "../../src/components/pytitle"


customElements.define("py-title", PyTitle);


describe("PyTitle", () => {
  let instance: PyTitle;

  beforeEach(() => {
    instance = new PyTitle();
  })

  it("PyTitle instantiates correctly", async () => {
    expect(instance).toBeInstanceOf(PyTitle);
  })

  it("test connectedCallback defaults", async () => {
    instance.connectedCallback();
    expect(instance.label).toBe("")
    expect(instance.mount_name).toBe("")
    expect(instance.innerHTML).toBe(`<div class=\"py-title\" id=\"\"><h1></h1></div>`)
  })

  it("label renders correctly on the page and updates id", async () => {
    instance.innerHTML = "Hello, world!"
    // We need this to test mount_name works properly since connectedCallback
    // doesn't automatically call checkId (should it?)
    instance.checkId();

    instance.connectedCallback();

    expect(instance.label).toBe("Hello, world!")
    // mount_name should be similar to: py_be025f4c_2150_7f2a_1a85_af92970c2a0e
    expect(instance.mount_name).toMatch(/py_(\w+_){1,5}/);
    expect(instance.innerHTML).toContain("<h1>Hello, world!</h1>")
  })
})
