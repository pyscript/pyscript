import { jest } from '@jest/globals';
import { PyLoader } from "../../src/components/pyloader"
import { getLogger } from "../../src/logger"

customElements.define('py-loader', PyLoader);

describe('PyLoader', () => {
  let instance: PyLoader;
  const logger = getLogger("py-loader")


  beforeEach(() => {
    instance = new PyLoader();
    logger.info = jest.fn()
  })

  it('PyLoader instantiates correctly', async () => {
    expect (instance).toBeInstanceOf(PyLoader);
  })

  it('connectedCallback adds splash screen', async () => {
    // innerHTML should be empty
    expect(instance.innerHTML).toBe("")
    instance.connectedCallback();

    // This is just checking that we have some ids or class names
    expect(instance.innerHTML).toContain('pyscript_loading_splash')
    expect(instance.innerHTML).toContain("spinner")

    expect(instance.mount_name).toBe("")
  })

  it('confirm calling log will log to console and page', () => {
    const element = document.createElement('div')
    element.setAttribute("id", "pyscript-operation-details")

    instance.details = element
    instance.log("Hello, world!")

    const printedLog = element.getElementsByTagName('p')

    expect(logger.info).toHaveBeenCalledWith("Hello, world!")
    expect(printedLog[0].innerText).toBe("Hello, world!")
  })

  it('confirm that calling close removes element', async () => {
    instance.remove = jest.fn()
    instance.close()
    expect(logger.info).toHaveBeenCalledWith("Closing")
    expect(instance.remove).toHaveBeenCalled()
  })
})
