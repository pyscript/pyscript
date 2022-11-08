from .support import PyScriptTest


class TestPyInputBox(PyScriptTest):
    def test_input_box_typing(self):
        self.pyscript_run(
            """
            <py-inputbox label="my input">
                import js
                def on_keypress(evt):
                    if evt.key == "Enter":
                        js.console.log(evt.target.value)
            </py-inputbox>
            """
        )
        assert self.console.log.lines == [self.PY_COMPLETE]
        input = self.page.locator("input")

        input.type("Hello")
        input.press("Enter")

        assert self.console.log.lines == [self.PY_COMPLETE, "Hello"]

    def test_deprecated_element(self):
        self.pyscript_run(
            """
            <py-inputbox label="my input">
                import js
                def on_keypress(evt):
                    if evt.key == "Enter":
                        js.console.log(evt.target.value)
            </py-inputbox>
            """
        )
        banner = self.page.locator(".py-warning")
        banner_content = banner.inner_text()
        expected = (
            "The element <py-input> is deprecated, create a function with your "
            'inline code and use <input py-input="function()"> instead.'
        )

        assert banner_content == expected
