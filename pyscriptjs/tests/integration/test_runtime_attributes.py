from .support import PyScriptTest, skip_worker


class TestPyScriptRuntimeAttributes(PyScriptTest):
    @skip_worker("FIXME: js.document")
    def test_injected_html_with_py_event(self):
        self.pyscript_run(
            r"""
            <div id="py-button-container"></div>
            <py-script>
              import js

              py_button = Element("py-button-container")
              py_button.element.innerHTML = '<button py-click="print_hello()"></button>'

              def print_hello():
                js.console.log("hello pyscript")
            </py-script>
            """
        )
        self.page.locator("button").click()
        assert self.console.log.lines == ["hello pyscript"]

    @skip_worker("FIXME: js.document")
    def test_added_py_event(self):
        self.pyscript_run(
            r"""
            <button id="py-button"></button>
            <py-script>
              import js

              py_button = Element("py-button")
              py_button.element.setAttribute("py-click", "print_hello()")

              def print_hello():
                js.console.log("hello pyscript")
            </py-script>
            """
        )
        self.page.locator("button").click()
        assert self.console.log.lines == ["hello pyscript"]

    @skip_worker("FIXME: js.document")
    def test_added_then_removed_py_event(self):
        self.pyscript_run(
            r"""
            <button id="py-button">live content</button>
            <py-script>
              import js

              py_button = Element("py-button")
              py_button.element.setAttribute("py-click", "print_hello()")

              def print_hello():
                js.console.log("hello pyscript")
                py_button.element.removeAttribute("py-click")
            </py-script>
            """
        )
        self.page.locator("button").click()
        self.page.locator("button").click()
        assert self.console.log.lines == ["hello pyscript"]
