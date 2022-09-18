import { jest } from "@jest/globals"

import { PyInputBox } from "../../src/components/pyinputbox"

customElements.define('py-inputbox', PyInputBox)

describe("PyInputBox", () => {
  let instance: PyInputBox;

  beforeEach(() => {
    instance = new PyInputBox()
    instance.runAfterRuntimeInitialized = jest.fn();
  })

  it("PyInputBox instantiates correctly", async () => {
    expect(instance).toBeInstanceOf(PyInputBox)
  })

  it('connectedCallback gets or sets a new id', async () => {
    expect(instance.id).toBe('');

    instance.connectedCallback();
    const instanceId = instance.id;
    // id should be similar to py-4850c8c3-d70d-d9e0-03c1-3cfeb0bcec0d-container
    expect(instanceId).toMatch(/py-(\w+-){1,5}container/);

    // calling checkId directly should return the same id
    instance.checkId();
    expect(instance.id).toEqual(instanceId);
  });

  it('confirm that runAfterRuntimeInitialized is called', async () => {
    const mockedRunAfterRuntimeInitialized = jest
      .spyOn(instance, 'runAfterRuntimeInitialized')
      .mockImplementation(jest.fn());

    instance.connectedCallback();

    expect(mockedRunAfterRuntimeInitialized).toHaveBeenCalled();
  })

  it('onCallback sets mount_name based on id', async () => {
    expect(instance.id).toBe('');
    expect(instance.mount_name).toBe(undefined);

    instance.connectedCallback();

    const instanceId = instance.id;

    expect(instanceId).toMatch(/py-(\w+-){1,5}container/);
    expect(instance.mount_name).toBe(instanceId.replace('-container', '').split('-').join('_'));
    });

    it('onCallback updates on_keypress code and function name ', async () => {
      expect(instance.code).toBe(undefined);
      expect(instance.innerHTML).toBe('');

      instance.innerHTML = '\ndef on_keypress(e):\n';

      instance.connectedCallback();

      expect(instance.code).toMatch(/def\son_keypress_py_(\w+)\(e\)/);
      expect(instance.innerHTML).toContain('<input type="text" class="py-input"');
    });

})
