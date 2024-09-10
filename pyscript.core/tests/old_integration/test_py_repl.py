import platform

import pytest

from .support import PyScriptTest, skip_worker

pytest.skip(
    reason="NEXT: pyscript NEXT doesn't support the REPL yet",
    allow_module_level=True,
)


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
        py_repl = self.page.query_selector("py-repl .py-repl-box")
        assert py_repl

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
        src = py_repl.locator("div.cm-content").inner_text()
        assert "print('hello from py-repl')" in src
        py_repl.locator("button").click()
        self.page.wait_for_selector("py-terminal")
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
        self.page.wait_for_selector("py-terminal")
        assert self.console.log.lines[-1] == "hello"

    def test_execute_on_shift_enter(self):
        self.pyscript_run(
            """
            <py-repl>
                print("hello world")
            </py-repl>
            """
        )
        self.page.wait_for_selector("py-repl .py-repl-run-button")
        self.page.keyboard.press("Shift+Enter")
        self.page.wait_for_selector("py-terminal")

        assert self.console.log.lines[-1] == "hello world"

        # Shift-enter should not add a newline to the editor
        assert self.page.locator(".cm-line").count() == 1

    @skip_worker("FIXME: display()")
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
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert out_div.inner_text() == "hello world"

    @skip_worker("TIMEOUT")
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
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert out_div.inner_text() == "42"

    @skip_worker("TIMEOUT")
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

        out_div = self.page.wait_for_selector("#repl-target")
        assert out_div.inner_text() == "42"

    @skip_worker("FIXME: display()")
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
        self.page.keyboard.press("Shift+Enter")
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert out_div.inner_text() == "hello world"
        # clear the editor, write new code, execute
        self._replace(py_repl, "display('another output')")
        self.page.keyboard.press("Shift+Enter")
        # test runner can be too fast, the line below should wait for output to change
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
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
        self.page.wait_for_selector(".py-error")
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
        #
        self.check_py_errors("this is an error")

    @skip_worker("FIXME: display()")
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
        self.page.wait_for_selector("#py-internal-0-repl-output")
        assert self.page.inner_text("#py-internal-0-repl-output") == "first"

        second_py_repl = self.page.get_by_text("second")
        second_py_repl.click()
        self.page.keyboard.press("Shift+Enter")
        self.page.wait_for_selector("#py-internal-1-repl-output")
        assert self.page.inner_text("#py-internal-1-repl-output") == "second"

    @skip_worker("FIXME: display()")
    def test_python_exception_after_previous_output(self):
        self.pyscript_run(
            """
            <py-repl>
                display('hello world')
            </py-repl>
            """
        )
        py_repl = self.page.locator("py-repl")
        self.page.keyboard.press("Shift+Enter")
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert out_div.inner_text() == "hello world"
        #
        # clear the editor, write new code, execute
        self._replace(py_repl, "0/0")
        self.page.keyboard.press("Shift+Enter")
        # test runner can be too fast, the line below should wait for output to change
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert "hello world" not in out_div.inner_text()
        assert "ZeroDivisionError" in out_div.inner_text()
        #
        self.check_py_errors("ZeroDivisionError")

    @skip_worker("FIXME: js.document")
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
        self.page.keyboard.press("Shift+Enter")
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert "this is an error" in out_div.inner_text()
        #
        self._replace(py_repl, "display('hello')")
        self.page.keyboard.press("Shift+Enter")
        # test runner can be too fast, the line below should wait for output to change
        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert out_div.inner_text() == "hello"
        #
        self.check_py_errors("this is an error")

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

        banner = self.page.wait_for_selector(".py-warning")

        banner_content = banner.inner_text()
        expected = (
            'output = "I-dont-exist" does not match the id of any element on the page.'
        )
        assert banner_content == expected

    @skip_worker("TIMEOUT")
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

    @skip_worker("FIXME: display()")
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
        self.page.wait_for_selector("#py-internal-1-repl-output")
        self.page.keyboard.type("display('second children')")
        self.page.keyboard.press("Shift+Enter")
        self.page.wait_for_selector("#py-internal-1-1-repl-output")

        first_py_repl = self.page.get_by_text("root first")
        first_py_repl.click()
        self.page.keyboard.press("Shift+Enter")
        self.page.wait_for_selector("#py-internal-0-repl-output")
        self.page.keyboard.type("display('first children')")
        self.page.keyboard.press("Shift+Enter")
        self.page.wait_for_selector("#py-internal-0-1-repl-output")

        assert self.page.inner_text("#py-internal-1-1-repl-output") == "second children"
        assert self.page.inner_text("#py-internal-0-1-repl-output") == "first children"

    @skip_worker("FIXME: display()")
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

        target = self.page.wait_for_selector("#repl-target")
        assert "print from py-repl" in target.inner_text()

        out_div = self.page.wait_for_selector("#py-internal-0-repl-output")
        assert out_div.inner_text() == "display from py-repl"

        self.assert_no_banners()

    @skip_worker("FIXME: js.document")
    def test_repl_output_display_async(self):
        # py-repls running async code are not expected to
        # send display to element element
        self.pyscript_run(
            """
            <div id="repl-target"></div>
            <script type="py">
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
            </script>

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

    @skip_worker("FIXME: js.document")
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

        assert self.page.wait_for_selector("#first").inner_text() == "first.\n"

        second_repl = self.page.locator("py-repl#second-repl")
        second_repl.locator("button").click()
        assert self.page.wait_for_selector("#second").inner_text() == "second.\n"

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

        banner = self.page.wait_for_selector(".py-warning")

        banner_content = banner.inner_text()
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

        banner = self.page.wait_for_selector(".py-warning")

        banner_content = banner.inner_text()
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

        assert self.page.wait_for_selector("#stdout-div").inner_text() == "one.\ntwo.\n"
        assert self.page.wait_for_selector("#stderr-div").inner_text() == "one.\n"
        self.assert_no_banners()

    @skip_worker("TIMEOUT")
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
            </script>
            """
        )

        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()

        assert self.page.wait_for_selector("#first").inner_text() == "one.\n"
        assert self.page.wait_for_selector("#second").inner_text() == "two.\n"

        expected_alert_banner_msg = (
            'output = "third" does not match the id of any element on the page.'
        )

        alert_banner = self.page.wait_for_selector(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

    @skip_worker("TIMEOUT")
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
        assert self.page.wait_for_selector("#third").inner_text() == "one.\nthree.\n"

        expected_alert_banner_msg = (
            'output = "first" does not match the id of any element on the page.'
        )
        alert_banner = self.page.wait_for_selector(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

    def test_repl_load_content_from_src(self):
        self.writefile("loadReplSrc1.py", "print('1')")
        self.pyscript_run(
            """
            <py-repl id="py-repl1" output="replOutput1" src="./loadReplSrc1.py"></py-repl>
            <div id="replOutput1"></div>
            """
        )
        successMsg = "[py-repl] loading code from ./loadReplSrc1.py to repl...success"
        assert self.console.info.lines[-1] == successMsg

        py_repl = self.page.locator("py-repl")
        code = py_repl.locator("div.cm-content").inner_text()
        assert "print('1')" in code

    @skip_worker("TIMEOUT")
    def test_repl_src_change(self):
        self.writefile("loadReplSrc2.py", "2")
        self.writefile("loadReplSrc3.py", "print('3')")
        self.pyscript_run(
            """
            <py-repl id="py-repl2" output="replOutput2" src="./loadReplSrc2.py"></py-repl>
            <div id="replOutput2"></div>

            <py-repl id="py-repl3" output="replOutput3">
                import js
                target_tag = js.document.getElementById("py-repl2")
                target_tag.setAttribute("src", "./loadReplSrc3.py")
            </py-repl>
            <div id="replOutput3"></div>
            """
        )

        successMsg1 = "[py-repl] loading code from ./loadReplSrc2.py to repl...success"
        assert self.console.info.lines[-1] == successMsg1

        py_repl3 = self.page.locator("py-repl#py-repl3")
        py_repl3.locator("button").click()
        py_repl2 = self.page.locator("py-repl#py-repl2")
        py_repl2.locator("button").click()
        self.page.wait_for_selector("py-terminal")
        assert self.console.log.lines[-1] == "3"

        successMsg2 = "[py-repl] loading code from ./loadReplSrc3.py to repl...success"
        assert self.console.info.lines[-1] == successMsg2

    def test_repl_src_path_that_do_not_exist(self):
        self.pyscript_run(
            """
            <py-repl id="py-repl4" output="replOutput4" src="./loadReplSrc4.py"></py-repl>
            <div id="replOutput4"></div>
            """
        )
        errorMsg = (
            "(PY0404): Fetching from URL ./loadReplSrc4.py "
            "failed with error 404 (Not Found). "
            "Are your filename and path correct?"
        )
        assert self.console.error.lines[-1] == errorMsg
