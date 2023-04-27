from .support import PyScriptTest


class TestEventHandler(PyScriptTest):
    def test_coderunner(self):
        self.pyscript_run(
            """
            <button py-click-code="print('hello')">Click Me</button>
            """
        )
        btn = self.page.locator.get_by_role("button", name="Click Me")
        btn.click()
        assert "hello" in self.console.log.lines
