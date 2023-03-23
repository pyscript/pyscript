import platform

from .support import PyScriptTest, wait_for_render


class TestPyRepl(PyScriptTest):
    def _replace(self, py_repl, newcode):
        """
        Clear the editor and write new code in it.
        WARNING: this assumes that the textbox has already the focus
        """
        # clear the editor, write new code
        if "macOS" in platform.platform():
            self.page.keyboard.press("Meta+A")
        else:
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
        wait_for_render(self.page, "*", "hello world")

        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == "hello world"

        # Shift-enter should not add a newline to the editor
        assert self.page.locator(".cm-line").count() == 1

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
        assert out_div.all_inner_texts()[0] == "hello world"

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
        assert out_div.all_inner_texts()[0] == "42"

    def test_show_last_expression_with_output(self):
        """
        Test that we display() the value of the last expression, as you would
        expect by a REPL
        """
        self.pyscript_run(
            """
            <div id="repl-target"></div>
            <py-repl output="repl-target">
                42
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        out_div = py_repl.locator("div.py-repl-output")
        assert out_div.all_inner_texts()[0] == ""

        out_div = self.page.locator("#repl-target")
        assert out_div.all_inner_texts()[0] == "42"

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
        assert out_div.all_inner_texts()[0] == "hello world"
        #
        # clear the editor, write new code, execute
        self._replace(py_repl, "display('another output')")
        self.page.keyboard.press("Shift+Enter")
        print
        assert out_div.all_inner_texts()[0] == "another output"

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

    def test_multiple_repls(self):
        """
        Multiple repls showing in the correct order in the page
        """
        self.pyscript_run(
            """
            <py-repl data-testid=="first"> display("first") </py-repl>
            <py-repl data-testid=="second"> display("second") </py-repl>
            """
        )
        first_py_repl = self.page.get_by_text("first")
        first_py_repl.click()
        self.page.keyboard.press("Shift+Enter")
        assert self.page.inner_text("#py-internal-0-repl-output") == "first"

        second_py_repl = self.page.get_by_text("second")
        second_py_repl.click()
        self.page.keyboard.press("Shift+Enter")
        assert self.page.inner_text("#py-internal-1-repl-output") == "second"

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
        assert out_div.all_inner_texts()[0] == "hello world"
        #
        # clear the editor, write new code, execute
        self._replace(py_repl, "0/0")
        self.page.keyboard.press("Shift+Enter")
        assert "hello world" not in out_div.all_inner_texts()[0]
        assert "ZeroDivisionError" in out_div.all_inner_texts()[0]

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
        assert "this is an error" in out_div.all_inner_texts()[0]
        #
        self._replace(py_repl, "display('hello')")
        self.page.keyboard.press("Shift+Enter")
        assert out_div.all_inner_texts()[0] == "hello"

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

        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1

        banner_content = banner[0].inner_text()
        expected = (
            'output = "I-dont-exist" does not match the id of any element on the page.'
        )
        assert banner_content == expected

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
        self.page.locator('py-repl[exec-id="1"]').wait_for()
        assert py_repls.count() == 2
        assert outputs.count() == 2
        #
        # now we type something else: the new py-repl should have the focus
        self.page.keyboard.type("'world'")
        self.page.keyboard.press("Shift+Enter")
        self.page.locator('py-repl[exec-id="2"]').wait_for()
        assert py_repls.count() == 3
        assert outputs.count() == 3
        #
        # check that the code and the outputs are in order
        out_texts = [el.inner_text() for el in self.iter_locator(outputs)]
        assert out_texts == ["hello", "world", ""]

    def test_multiple_repls_mixed_display_order(self):
        """
        Displaying several outputs that don't obey the order in which the original
        repl displays were created using the auto_generate attr
        """
        self.pyscript_run(
            """
            <py-repl auto-generate="true" data-testid=="first"> display("root first") </py-repl>
            <py-repl auto-generate="true" data-testid=="second"> display("root second") </py-repl>
            """
        )

        second_py_repl = self.page.get_by_text("root second")
        second_py_repl.click()
        self.page.keyboard.press("Shift+Enter")
        self.page.keyboard.type("display('second children')")
        self.page.keyboard.press("Shift+Enter")

        first_py_repl = self.page.get_by_text("root first")
        first_py_repl.click()
        self.page.keyboard.press("Shift+Enter")
        self.page.keyboard.type("display('first children')")
        self.page.keyboard.press("Shift+Enter")

        assert self.page.inner_text("#py-internal-1-1-repl-output") == "second children"
        assert self.page.inner_text("#py-internal-0-1-repl-output") == "first children"

    def test_repl_output_attribute(self):
        # Test that output attribute sends stdout to the element
        # with the given ID, but not display()
        self.pyscript_run(
            """
            <div id="repl-target"></div>
            <py-repl output="repl-target">
                print('print from py-repl')
                display('display from py-repl')
            </py-repl>

            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        target = self.page.locator("#repl-target")
        assert "print from py-repl" in target.text_content()

        out_div = py_repl.locator("div.py-repl-output")
        assert out_div.all_inner_texts()[0] == "display from py-repl"

        self.assert_no_banners()

    def test_repl_output_display_async(self):
        # py-repls running async code are not expected to
        # send display to element element
        self.pyscript_run(
            """
            <div id="repl-target"></div>
            <py-script>
                import asyncio
                import js

                async def print_it():
                    await asyncio.sleep(1)
                    print('print from py-repl')


                async def display_it():
                    display('display from py-repl')
                    await asyncio.sleep(2)

                async def done():
                    await asyncio.sleep(3)
                    js.console.log("DONE")
            </py-script>

            <py-repl output="repl-target">
                asyncio.ensure_future(print_it());
                asyncio.ensure_future(display_it());
                asyncio.ensure_future(done());
            </py-repl>
            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        self.wait_for_console("DONE")

        assert self.page.locator("#repl-target").text_content() == ""
        self.assert_no_banners()

    def test_repl_stdio_dynamic_tags(self):
        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <py-repl output="first">
                import js

                print("first.")

                # Using string, since no clean way to write to the
                # code contents of the CodeMirror in a PyRepl
                newTag = '<py-repl id="second-repl" output="second">print("second.")</py-repl>'
                js.document.body.innerHTML += newTag
            </py-repl>
            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        assert self.page.locator("#first").text_content() == "first."

        second_repl = self.page.locator("py-repl#second-repl")
        second_repl.locator("button").click()
        assert self.page.locator("#second").text_content() == "second."

    def test_repl_output_id_errors(self):
        self.pyscript_run(
            """
            <py-repl output="not-on-page">
                print("bad.")
                print("bad.")
            </py-repl>

            <py-repl output="not-on-page">
                print("bad.")
            </py-repl>
            """
        )
        py_repls = self.page.query_selector_all("py-repl")
        for repl in py_repls:
            repl.query_selector_all("button")[0].click()

        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1

        banner_content = banner[0].inner_text()
        expected = (
            'output = "not-on-page" does not match the id of any element on the page.'
        )

        assert banner_content == expected

    def test_repl_stderr_id_errors(self):
        self.pyscript_run(
            """
            <py-repl stderr="not-on-page">
                import sys
                print("bad.", file=sys.stderr)
                print("bad.", file=sys.stderr)
            </py-repl>

            <py-repl stderr="not-on-page">
                print("bad.", file=sys.stderr)
            </py-repl>
            """
        )
        py_repls = self.page.query_selector_all("py-repl")
        for repl in py_repls:
            repl.query_selector_all("button")[0].click()

        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1

        banner_content = banner[0].inner_text()
        expected = (
            'stderr = "not-on-page" does not match the id of any element on the page.'
        )

        assert banner_content == expected

    def test_repl_output_stderr(self):
        # Test that stderr works, and routes to the same location as stdout
        # Also, repls with the stderr attribute route to an additional location
        self.pyscript_run(
            """
            <div id="stdout-div"></div>
            <div id="stderr-div"></div>
            <py-repl output="stdout-div" stderr="stderr-div">
                import sys
                print("one.", file=sys.stderr)
                print("two.")
            </py-repl>
            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        assert self.page.locator("#stdout-div").text_content() == "one.two."
        assert self.page.locator("#stderr-div").text_content() == "one."
        self.assert_no_banners()

    def test_repl_output_attribute_change(self):
        # If the user changes the 'output' attribute of a <py-repl> tag mid-execution,
        # Output should no longer go to the selected div and a warning should appear
        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <!-- There is no tag with id "third" -->
            <py-repl id="repl-tag" output="first">
                print("one.")

                # Change the 'output' attribute of this tag
                import js
                this_tag = js.document.getElementById("repl-tag")

                this_tag.setAttribute("output", "second")
                print("two.")

                this_tag.setAttribute("output", "third")
                print("three.")
            </py-script>
            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        assert self.page.locator("#first").text_content() == "one."
        assert self.page.locator("#second").text_content() == "two."

        expected_alert_banner_msg = (
            'output = "third" does not match the id of any element on the page.'
        )

        alert_banner = self.page.locator(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

    def test_repl_output_element_id_change(self):
        # If the user changes the ID of the targeted DOM element mid-execution,
        # Output should no longer go to the selected element and a warning should appear
        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <!-- There is no tag with id "third" -->
            <py-repl id="pyscript-tag" output="first">
                print("one.")

                # Change the ID of the targeted DIV to something else
                import js
                target_tag = js.document.getElementById("first")

                # should fail and show banner
                target_tag.setAttribute("id", "second")
                print("two.")

                # But changing both the 'output' attribute and the id of the target
                # should work
                target_tag.setAttribute("id", "third")
                js.document.getElementById("pyscript-tag").setAttribute("output", "third")
                print("three.")
            </py-repl>
            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        # Note the ID of the div has changed by the time of this assert
        assert self.page.locator("#third").text_content() == "one.three."

        expected_alert_banner_msg = (
            'output = "first" does not match the id of any element on the page.'
        )
        alert_banner = self.page.locator(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()
