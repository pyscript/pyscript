import pytest

from .support import PyScriptTest


class TestPyButton(PyScriptTest):
    @pytest.mark.xfail
    def test_on_click(self):
        """
        currently this test fails for a bad reason which is unrelated to
        py-button. During the page loading, the following JS exception occur,
        in base.ts:BaseEvalElement.evaluate

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
