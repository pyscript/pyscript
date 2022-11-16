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
                print("hello world")
            </py-repl>
            """
        )
        self.page.wait_for_selector("#runButton")
        self.page.keyboard.press("Shift+Enter")
        assert self.console.log.lines == [self.PY_COMPLETE, "hello world"]

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
        out_div = py_repl.locator("div.py-repl-output")
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
        out_div = py_repl.locator("div.py-repl-output")
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
        out_div = py_repl.locator("div.py-repl-output")
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
        err_pre = py_repl.locator("div.py-repl-output > pre.py-error")
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
        out_div = py_repl.locator("div.py-repl-output")
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
        out_div = py_repl.locator("div.py-repl-output")
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
        # check that we did NOT write to py-repl-output
        out_div = py_repl.locator("div.py-repl-output")
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
        out_div = py_repl.locator("div.py-repl-output")
        msg = "py-repl ERROR: cannot find the output element #I-dont-exist in the DOM"
        assert out_div.inner_text() == msg
        assert "I will not be executed" not in self.console.log.text

    def test_auto_generate(self):
        self.pyscript_run(
            """
            <py-repl auto-generate="true">
            </py-repl>
            """
        )
        py_repls = self.page.locator("py-repl")
        outputs = py_repls.locator("div.py-repl-output")
        assert py_repls.count() == 1
        assert outputs.count() == 1
        #
        # evaluate the py-repl, and wait for the newly generated one
        self.page.keyboard.type("'hello'")
        self.page.keyboard.press("Shift+Enter")
        self.page.locator('py-repl[exec-id="2"]').wait_for()
        assert py_repls.count() == 2
        assert outputs.count() == 2
        #
        # now we type something else: the new py-repl should have the focus
        self.page.keyboard.type("'world'")
        self.page.keyboard.press("Shift+Enter")
        self.page.locator('py-repl[exec-id="3"]').wait_for()
        assert py_repls.count() == 3
        assert outputs.count() == 3
        #
        # check that the code and the outputs are in order
        out_texts = [el.inner_text() for el in self.iter_locator(outputs)]
        assert out_texts == ["hello", "world", ""]
