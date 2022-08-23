import pytest

from .support import PyScriptTest


class TestPyRepl(PyScriptTest):
    def test_repl_loads(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )

        py_repl = self.page.query_selector("py-repl")
        assert py_repl
        assert "Python" in py_repl.inner_text()

    @pytest.mark.xfail
    def test_repl_runs_on_button_press(self):
        """
        Current this test fails due to an exception when we iterate over
        'importmaps'

        [  2.28 JS exception   ] TypeError: importmaps is not iterable
            at PyRepl._register_esm (http://127.0.0.1:8080/build/pyscript.js:227:37)
            at PyRepl.evaluate (http://127.0.0.1:8080/build/pyscript.js:252:22)
            at http://127.0.0.1:8080/build/pyscript.js:23678:21
            at runFor (http://127.0.0.1:8080/build/pyscript.js:11780:25)
            at runHandlers (http://127.0.0.1:8080/build/pyscript.js:11789:17)
            at Object.keydown (http://127.0.0.1:8080/build/pyscript.js:11691:20)
            at InputState.runCustomHandlers (http://127.0.0.1:8080/build/pyscript.js:8194:37)
            at HTMLDivElement.<anonymous> (http://127.0.0.1:8080/build/pyscript.js:8156:30)
        """
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )

        self.page.locator("py-repl").type("print(2+2)")

        # We only have one button in the page
        self.page.locator("button").click()

        # The result gets the id of the repl + n
        repl_result = self.page.locator("#my-repl-1")

        assert repl_result.inner_text() == "4"

    @pytest.mark.xfail
    def test_repl_runs_with_shift_enter(self):
        """
        Current this test fails due to an exception when we iterate over
        'importmaps'

        [  2.28 JS exception   ] TypeError: importmaps is not iterable
            at PyRepl._register_esm (http://127.0.0.1:8080/build/pyscript.js:227:37)
            at PyRepl.evaluate (http://127.0.0.1:8080/build/pyscript.js:252:22)
            at http://127.0.0.1:8080/build/pyscript.js:23678:21
            at runFor (http://127.0.0.1:8080/build/pyscript.js:11780:25)
            at runHandlers (http://127.0.0.1:8080/build/pyscript.js:11789:17)
            at Object.keydown (http://127.0.0.1:8080/build/pyscript.js:11691:20)
            at InputState.runCustomHandlers (http://127.0.0.1:8080/build/pyscript.js:8194:37)
            at HTMLDivElement.<anonymous> (http://127.0.0.1:8080/build/pyscript.js:8156:30)
        """
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("2+2")

        # Confirm that we get a result by using the keys shortcut
        self.page.keyboard.press("Shift+Enter")
        repl_result = self.page.locator("#my-repl-1")

        assert repl_result.text_content() == "4"
