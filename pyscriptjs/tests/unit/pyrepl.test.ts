import 'jest';

import { PyRepl } from '../../src/components/pyrepl';

customElements.define('py-repl', PyRepl);

describe('PyRepl', () => {
    let instance: PyRepl;
    beforeEach(() => {
        instance = new PyRepl();
    });

    it('should get the current Repl to just instantiate', async () => {
        expect(instance).toBeInstanceOf(PyRepl);
    });

    it('confirm that codemirror editor is available', async () => {
        // We are assuming that if editorNode has the 'editor-box' class
        // then the div was created properly.
        expect(instance.editorNode.getAttribute('class')).toBe("editor-box")
    })

    it("connectedCallback gets or sets new id", async () => {
        expect(instance.id).toBe("")

        instance.connectedCallback()

        const instanceId = instance.id;
        // id should be similar to py-4850c8c3-d70d-d9e0-03c1-3cfeb0bcec0d
        expect(instanceId).toMatch(/py-(\w+-){1,4}\w+/);

        // calling checkId directly should return the same id
        instance.checkId();
        expect(instance.id).toEqual(instanceId);
    })

    it('confirm that calling connectedCallback renders the expected elements', async () => {
        expect(instance.innerHTML).toBe("")
        instance.innerHTML = "<p>Hello</p>"
        instance.connectedCallback()

        expect(instance.code).toBe("<p>Hello</p>")
        expect(instance.editorNode.id).toBe("code-editor")

        // Just check that the button was created
        expect(instance.btnRun.getAttribute("class")).toBe("absolute repl-play-button")
        const editorNode  = instance.editorNode.innerHTML
        expect(editorNode).toContain("Python Script Run Button")
        // Confirm that our innerHTML is set as well
        expect(editorNode).toContain("Hello")
    })

    it("confirm that addToOutput updates output element", async () => {
        expect(instance.outputElement).toBe(undefined)

        // This is just to avoid throwing the test since outputElement is undefined
        instance.outputElement = document.createElement("div")

        instance.addToOutput("Hello, World!")

        expect(instance.outputElement.innerHTML).toBe("<div>Hello, World!</div>")
        expect(instance.outputElement.hidden).toBe(false)
    })

});
