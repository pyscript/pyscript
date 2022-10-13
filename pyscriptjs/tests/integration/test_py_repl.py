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

    def test_repl_runs_on_button_press(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )

        self.page.locator("py-repl").type("display(\"hello\")")

        # We only have one button in the page
        self.page.locator("button").click()

        # The result gets the id of the repl + n
        repl_result = self.page.wait_for_selector("#my-repl-2", state="attached")

        assert repl_result.inner_text() == "hello"

    def test_repl_runs_with_shift_enter(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("display(\"hello\")")

        # Confirm that we get a result by using the keys shortcut
        self.page.keyboard.press("Shift+Enter")
        py_repl = self.page.query_selector("#my-repl-2")
        assert "hello" in py_repl.inner_text()

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

    # console errors are observable on the headed instance
    # but is just not possible to access them using the self object
    @pytest.mark.xfail(reason='Cannot access console errors')
    def test_repl_error_ouput_console(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("this is an error")
        self.page.locator("button").click()

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

    # this tests the fact that a new error div should be created once there's
    # an error but also that it should disappear automatically once the error
    # is fixed
    def test_repl_show_error_fix_error_check_for_ouput(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("d")
        self.page.keyboard.press("Shift+Enter")
        assert self.page.locator(".py-error").is_visible()
        self.page.locator("py-repl").type("isplay('ok')")
        self.page.keyboard.press("Shift+Enter")
        repl_result = self.page.wait_for_selector("#my-repl-2", state="attached")
        assert repl_result.inner_text() == "ok"
