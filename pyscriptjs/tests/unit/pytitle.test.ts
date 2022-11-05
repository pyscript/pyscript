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
    instance.innerHTML = "Hello, world!";
    instance.id = "my-fancy-title";

    instance.connectedCallback();

    expect(instance.label).toBe("Hello, world!")
    expect(instance.mount_name).toMatch("my_fancy_title");
    expect(instance.innerHTML).toContain("<h1>Hello, world!</h1>")
  })
})
