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
        assert self.console.log.lines[0] == self.PY_COMPLETE
        input = self.page.locator("input")

        input.type("Hello")
        input.press("Enter")

        assert self.console.log.lines[-1] == "Hello"

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
            "The element <py-input> is deprecated, "
            'use <input class="py-input"> instead.'
        )

        assert banner_content == expected
