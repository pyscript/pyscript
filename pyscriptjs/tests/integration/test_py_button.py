from .support import PyScriptTest


class TestPyButton(PyScriptTest):
    def test_on_click(self):
        self.pyscript_run(
            """
            <py-button label="my button">
                import js
                def on_click(evt):
                    js.console.log('clicked!')
            </py-button>
        """
        )
        assert self.console.log.lines == [self.PY_COMPLETE]
        self.page.locator("text=my button").click()
        self.page.locator("text=my button").click()
        assert self.console.log.lines == [self.PY_COMPLETE, "clicked!", "clicked!"]
