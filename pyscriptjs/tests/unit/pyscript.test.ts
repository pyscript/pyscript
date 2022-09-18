import { jest } from "@jest/globals"

import { PyScript } from "../../src/components/pyscript"

customElements.define('py-script', PyScript)

describe('PyScript', () => {
  let instance: PyScript;

  beforeEach(() => {
    instance = new PyScript();
  })

  it('PyScript instantiates correctly', async () => {
    expect(instance).toBeInstanceOf(PyScript)
  })

  it('connectedCallback gets or sets a new id', async () => {
    expect(instance.id).toBe('');

    instance.connectedCallback();
    const instanceId = instance.id;
    // id should be similar to py-4850c8c3-d70d-d9e0-03c1-3cfeb0bcec0d-container
    expect(instanceId).toMatch(/py-(\w+-){1,5}/);

    // calling checkId directly should return the same id
    instance.checkId();
    expect(instance.id).toEqual(instanceId);
  });

  it('connectedCallback creates output div', async () => {
    instance.connectedCallback();

    expect(instance.innerHTML).toContain('<div class="output">')
  })

  it('confirm that outputElement has std-out id element', async () => {
    expect(instance.outputElement).toBe(undefined);

    instance.setAttribute('id', 'std-out')
    instance.connectedCallback();

    expect(instance.outputElement.getAttribute('id')).toBe("std-out")
  })

  it('confirm that std-err id element sets errorElement', async () => {
    expect(instance.outputElement).toBe(undefined);

    instance.setAttribute('id', 'std-err')
    instance.connectedCallback();

    // We should have an errorElement
    expect(instance.errorElement.getAttribute('id')).toBe("std-err")
  })

  it('test output attribute path', async () => {
    expect(instance.outputElement).toBe(undefined);
    expect(instance.errorElement).toBe(undefined)

    const createdOutput = document.createElement("output")

    instance.setAttribute('output', 'output')
    instance.connectedCallback();

    expect(instance.innerHTML).toBe('<div class="output"></div>')
  })

  it('getSourceFromElement returns decoded html', async () => {
    instance.innerHTML = "<p>Hello</p>"

    instance.connectedCallback();
    const source = instance.getSourceFromElement();

    expect(source).toBe("<p>Hello</p>")
  })
})
