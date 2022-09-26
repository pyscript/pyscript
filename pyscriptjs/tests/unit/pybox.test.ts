import { jest } from "@jest/globals"

import { PyBox } from "../../src/components/pybox"

customElements.define('py-box', PyBox)

describe('PyBox', () => {
  let instance: PyBox;

  beforeEach(() => {
    instance = new PyBox();
  })

  it('PyBox instantiates correctly', async () => {
    expect(instance).toBeInstanceOf(PyBox)
  })

  it("test connectedCallback creates pybox div", async () => {
    expect(instance.innerHTML).toBe("")
    instance.connectedCallback()

    expect(instance.innerHTML).toBe('<div class=\"py-box\"></div>')
  })

})
