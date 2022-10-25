from .support import PyScriptTest


class TestPyRepl(PyScriptTest):
    def _replace(self, py_repl, newcode):
        """
        Clear the editor and write new code in it.
        WARNING: this assumes that the textbox has already the focus
        """
        # clear the editor, write new code
        self.page.keyboard.press("Control+A")
        self.page.keyboard.press("Backspace")
        self.page.keyboard.type(newcode)

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
            <py-repl>
                display('hello world')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        out_div = py_repl.locator("div.py-output")
        assert out_div.inner_text() == "hello world"

    def test_show_last_expression(self):
        """
        Test that we display() the value of the last expression, as you would
        expect by a REPL
        """
        self.pyscript_run(
            """
            <py-repl>
                42
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        out_div = py_repl.locator("div.py-output")
        assert out_div.inner_text() == "42"

    def test_run_clears_previous_output(self):
        """
        Check that we clear the previous output of the cell before executing it
        again
        """
        self.pyscript_run(
            """
            <py-repl>
                display('hello world')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        out_div = py_repl.locator("div.py-output")
        self.page.keyboard.press("Shift+Enter")
        assert out_div.inner_text() == "hello world"
        #
        # clear the editor, write new code, execute
        self._replace(py_repl, "display('another output')")
        self.page.keyboard.press("Shift+Enter")
        assert out_div.inner_text() == "another output"

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

    def test_python_exception_after_previous_output(self):
        self.pyscript_run(
            """
            <py-repl>
                display('hello world')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        out_div = py_repl.locator("div.py-output")
        self.page.keyboard.press("Shift+Enter")
        assert out_div.inner_text() == "hello world"
        #
        # clear the editor, write new code, execute
        self._replace(py_repl, "0/0")
        self.page.keyboard.press("Shift+Enter")
        assert "hello world" not in out_div.inner_text()
        assert "ZeroDivisionError" in out_div.inner_text()

    def test_hide_previous_error_after_successful_run(self):
        """
        this tests the fact that a new error div should be created once there's an
        error but also that it should disappear automatically once the error
        is fixed
        """
        self.pyscript_run(
            """
            <py-repl>
                raise Exception('this is an error')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        out_div = py_repl.locator("div.py-output")
        self.page.keyboard.press("Shift+Enter")
        assert "this is an error" in out_div.inner_text()
        #
        self._replace(py_repl, "display('hello')")
        self.page.keyboard.press("Shift+Enter")
        assert out_div.inner_text() == "hello"

    def test_output_attribute(self):
        self.pyscript_run(
            """
            <py-repl output="mydiv">
                display('hello world')
            </py-repl>
            <hr>
            <div id="mydiv"></div>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        #
        # check that we did NOT write to py-output
        out_div = py_repl.locator("div.py-output")
        assert out_div.inner_text() == ""
        # check that we are using mydiv instead
        mydiv = self.page.locator("#mydiv")
        assert mydiv.inner_text() == "hello world"

    def test_output_attribute_does_not_exist(self):
        """
        If we try to use an attribute which doesn't exist, we display an error
        instead
        """
        self.pyscript_run(
            """
            <py-repl output="I-dont-exist">
                print('I will not be executed')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        #
        out_div = py_repl.locator("div.py-output")
        msg = "py-repl ERROR: cannot find the output element #I-dont-exist in the DOM"
        assert out_div.inner_text() == msg
        assert "I will not be executed" not in self.console.log.text
