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

    def test_repl_runs_on_button_press(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )

        self.page.locator("py-repl").type("print(2+2)")

        # We only have one button in the page
        self.page.locator("button").click()

        # The result gets the id of the repl + n
        repl_result = self.page.wait_for_selector("#my-repl-1", state="attached")

        assert repl_result.inner_text() == "4"

    def test_repl_runs_with_shift_enter(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("2+2")

        # Confirm that we get a result by using the keys shortcut
        self.page.keyboard.press("Shift+Enter")
        repl_result = self.page.wait_for_selector("#my-repl-1", state="attached")

        assert repl_result.text_content() == "4"
