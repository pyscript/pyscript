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

    def test_repl_console_ouput(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("print('apple')")
        self.page.keyboard.press("Enter")
        self.page.locator("py-repl").type("console.log('banana')")
        self.page.locator("button").click()

        # The result gets the id of the repl + n
        repl_result = self.page.wait_for_selector("#my-repl-1", state="attached")

        assert repl_result.inner_text() == ""

    def test_repl_error_ouput(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("this is an error")
        self.page.locator("button").click()
        repl_result = self.page.wait_for_selector("#my-repl-1", state="attached")
        assert self.page.locator(".py-error").is_visible()

    def test_repl_error_ouput_console(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("this is an error")
        self.page.locator("button").click()
        console_text = self.console.all.lines
        for t in console_text:
             print('🔥', t)
        print('☀️')
        self.page.on("console", lambda msg: print('🌸', msg.text))
        print('☀️')

    def test_repl_error_and_fail_moving_forward_ouput(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("this is an error")
        self.page.locator("button").click()
        repl_result = self.page.wait_for_selector("#my-repl-1", state="attached")
        assert self.page.locator(".py-error").is_visible()
        self.page.keyboard.press("Shift+Enter")
        assert self.page.locator(".py-error").is_visible()

    def test_repl_error_and_fix_ouput(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("p")
        self.page.keyboard.press("Shift+Enter")
        assert self.page.locator(".py-error").is_visible()
        self.page.locator("py-repl").type("rint('ok')")
        self.page.keyboard.press("Shift+Enter")
        assert not self.page.locator(".py-error").is_visible()
