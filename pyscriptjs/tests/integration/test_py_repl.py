from playwright.sync_api import expect

from .support import PyScriptTest


class TestPyRepl(PyScriptTest):
    def test_repl_loads(self):
        self.pyscript_run(
            """
            <py-repl></py-repl>
            """
        )
        py_repl = self.page.query_selector("py-repl")
        assert py_repl
        assert "Python" in py_repl.inner_text()

    def test_execute_preloaded_source(self):
        """
        Unfortunately it tests two things at once, but it's impossible to write a
        smaller test. I think this is the most basic test that we can write.

        We test that:
            1. the source code that we put in the tag is loaded inside the editor
            2. clicking the button executes it
        """
        self.pyscript_run(
            """
            <py-repl>
                print('hello from py-repl')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        src = py_repl.inner_text()
        assert "print('hello from py-repl')" in src
        py_repl.locator("button").click()
        assert self.console.log.lines[-1] == "hello from py-repl"

    def test_execute_code_typed_by_the_user(self):
        self.pyscript_run(
            """
            <py-repl></py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.type('print("hello")')
        py_repl.locator("button").click()
        assert self.console.log.lines[-1] == "hello"

    def test_execute_on_shift_enter(self):
        self.pyscript_run(
            """
            <py-repl>
                print("hello")
            </py-repl>
            """
        )
        self.page.keyboard.press("Shift+Enter")
        # wait_for_timeout(0) is basically the equivalent of an "await", it
        # lets the playwright engine to do its things and the console message
        # to be captured by out machinery. I don't really understand why with
        # keyboard.press() we need it, but with button.click() we don't. I
        # guess that button.click() does something equivalent internally, but
        # I didn't investigate further.
        self.page.wait_for_timeout(0)
        assert self.console.log.lines[-1] == "hello"

    def test_display(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl">
                display('hello world')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        out_div = py_repl.locator("div.py-output")
        assert out_div.inner_text() == "hello world"

    def test_python_exception(self):
        """
        See also test01_basic::test_python_exception, since it's very similar
        """
        self.pyscript_run(
            """
            <py-repl>
                raise Exception('this is an error')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        #
        # check that we sent the traceback to the console
        tb_lines = self.console.error.lines[-1].splitlines()
        assert tb_lines[0] == "[pyexec] Python exception:"
        assert tb_lines[1] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error"
        #
        # check that we show the traceback in the page
        err_pre = py_repl.locator("div.py-output > pre.py-error")
        tb_lines = err_pre.inner_text().splitlines()
        assert tb_lines[0] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error"

    def test_repl_error_and_fail_moving_forward_ouput(self):
        self.pyscript_run(
            """
            <py-repl id="my-repl" auto-generate="true"> </py-repl>
            """
        )
        self.page.locator("py-repl").type("this is an error")
        self.page.locator("button").click()
        expect(self.page.locator(".py-error")).to_be_visible()
        self.page.keyboard.press("Shift+Enter")
        expect(self.page.locator(".py-error")).to_be_visible()

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
        expect(self.page.locator(".py-error")).to_be_visible()
        self.page.keyboard.press("Backspace")
        self.page.locator("py-repl").type("display('ok')")
        self.page.keyboard.press("Shift+Enter")
        repl_result = self.page.wait_for_selector("#my-repl-2", state="attached")
        assert repl_result.inner_text() == "ok"
