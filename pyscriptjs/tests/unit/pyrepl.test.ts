import 'jest';
import type { Runtime } from "../../src/runtime"
import { FakeRuntime } from "./fakeruntime"
import { make_PyRepl } from '../../src/components/pyrepl';

const runtime: Runtime = new FakeRuntime();
const PyRepl = make_PyRepl(runtime);
customElements.define('py-repl', PyRepl);

describe('PyRepl', () => {
    let instance;
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
});
