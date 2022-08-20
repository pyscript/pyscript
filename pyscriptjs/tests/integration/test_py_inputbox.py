import time

import pytest

from .support import PyScriptTest


class TestPyInputBox(PyScriptTest):
    @pytest.mark.xfail
    def test_input_box_typing(self):
        """
        This test fails in a similar fashion as the pybutton
        test so it's xfailed for now.

        [JS exception   ] TypeError: Cannot use 'in' operator to search for 'runPythonAsync' in undefined
            at http://127.0.0.1:8080/build/pyscript.js:305:38
            at Object.subscribe (http://127.0.0.1:8080/build/pyscript.js:46:13)
            at PyButton.runAfterRuntimeInitialized (http://127.0.0.1:8080/build/pyscript.js:304:27)
            at PyButton.connectedCallback (http://127.0.0.1:8080/build/pyscript.js:26856:18)
            at http://127.0.0.1:8080/build/pyscript.js:27075:20
            at http://127.0.0.1:8080/build/pyscript.js:27093:3
        """  # noqa: E501
        self.pyscript_run(
            """
            <py-inputbox label="my input">
                import js
                def on_keypress(evt):
                    if evt.key == "Enter":
                        js.console.info(evt.target.value)
            </py-inputbox>
            """
        )
        assert self.console.info.lines == []
        input = self.page.locator("input")
        # We need to wait some time before we can type any text
        # otherwise it won't be registered. This was the smallest
        # amount that seems to work.
        time.sleep(0.1)
        input.type("Hello")
        input.press("Enter")

        assert self.console.info.text == "Hello"
