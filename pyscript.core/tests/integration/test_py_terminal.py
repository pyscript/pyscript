import time

import pytest
from playwright.sync_api import expect

from .support import PageErrors, PyScriptTest, only_worker, skip_worker


class TestPyTerminal(PyScriptTest):
    def test_multiple_terminals(self):
        """
        Multiple terminals are not currently supported
        """
        self.pyscript_run(
            """
            <script type="py" terminal></script>
            <script type="py" terminal></script>
            """,
            wait_for_pyscript=False,
            check_js_errors=False,
        )
        assert self.assert_banner_message("You can use at most 1 terminal")

        with pytest.raises(PageErrors, match="You can use at most 1 terminal"):
            self.check_js_errors()

    # TODO: interactive shell still unclear
    # @only_worker
    # def test_py_terminal_input(self):
    #     """
    #     Only worker py-terminal accepts an input
    #     """
    #     self.pyscript_run(
    #         """
    #         <script type="py" terminal></script>
    #         """,
    #         wait_for_pyscript=False,
    #     )
    #     self.page.get_by_text(">>> ", exact=True).wait_for()
    #     self.page.keyboard.type("'the answer is ' + str(6 * 7)")
    #     self.page.keyboard.press("Enter")
    #     self.page.get_by_text("the answer is 42").wait_for()

    @only_worker
    def test_py_terminal_os_write(self):
        """
        An `os.write("text")` should land in the terminal
        """
        self.pyscript_run(
            """
            <script type="py" terminal>
                import os
                os.write(1, str.encode("hello\\n"))
                os.write(2, str.encode("world\\n"))
            </script>
            """,
            wait_for_pyscript=False,
        )
        self.page.get_by_text("hello\n").wait_for()
        self.page.get_by_text("world\n").wait_for()

    def test_py_terminal(self):
        """
        1. <py-terminal> should redirect stdout and stderr to the DOM

        2. they also go to the console as usual
        """
        self.pyscript_run(
            """
            <script type="py" terminal>
                import sys
                print('hello world')
                print('this goes to stderr', file=sys.stderr)
                print('this goes to stdout')
            </script>
            """,
            wait_for_pyscript=False,
        )
        self.page.get_by_text("hello world").wait_for()
        term = self.page.locator("py-terminal")
        term_lines = term.inner_text().splitlines()
        assert term_lines[0:3] == [
            "hello world",
            "this goes to stderr",
            "this goes to stdout",
        ]

    @skip_worker(
        "Workers don't have events + two different workers don't share the same I/O"
    )
    def test_button_action(self):
        self.pyscript_run(
            """
            <script type="py">
                def greetings(event):
                    print('hello world')
            </script>
            <script type="py" terminal></script>

            <button id="my-button" py-click="greetings">Click me</button>
            """
        )
        term = self.page.locator("py-terminal")
        self.page.locator("button").click()
        last_line = self.page.get_by_text("hello world")
        last_line.wait_for()
        assert term.inner_text().rstrip() == "hello world"

    def test_xterm_function(self):
        """Test a few basic behaviors of the xtermjs terminal.

        This test isn't meant to capture all of the behaviors of an xtermjs terminal;
        rather, it confirms with a few basic formatting sequences that (1) the xtermjs
        terminal is functioning/loaded correctly and (2) that output toward that terminal
        isn't being escaped in a way that prevents it reacting to escape seqeunces. The
        main goal is preventing regressions.
        """
        self.pyscript_run(
            """
            <script type="py" terminal>
                print("\x1b[33mYellow\x1b[0m")
                print("\x1b[4mUnderline\x1b[24m")
                print("\x1b[1mBold\x1b[22m")
                print("\x1b[3mItalic\x1b[23m")
                print("done")
            </script>
            """,
            wait_for_pyscript=False,
        )

        # Wait for "done" to actually appear in the xterm; may be delayed,
        # since xtermjs processes its input buffer in chunks
        last_line = self.page.get_by_text("done")
        last_line.wait_for()

        # Yes, this is not ideal. However, per http://xtermjs.org/docs/guides/hooks/
        # "It is not possible to conclude, whether or when a certain chunk of data
        # will finally appear on the screen," which is what we'd really like to know.
        # By waiting for the "done" test to appear above, we get close, however it is
        # possible for the text to appear and not be 'processed' (i.e.) formatted. This
        # small delay should avoid that.
        time.sleep(1)

        rows = self.page.locator(".xterm-rows")

        # The following use locator.evaluate() and getComputedStyle to get
        # the computed CSS values; this tests that the lines are rendering
        # properly in a better way than just testing whether they
        # get the right css classes from xtermjs

        # First line should be yellow
        first_line = rows.locator("div").nth(0)
        first_char = first_line.locator("span").nth(0)
        color = first_char.evaluate(
            "(element) => getComputedStyle(element).getPropertyValue('color')"
        )
        assert color == "rgb(196, 160, 0)"

        # Second line should be underlined
        second_line = rows.locator("div").nth(1)
        first_char = second_line.locator("span").nth(0)
        text_decoration = first_char.evaluate(
            "(element) => getComputedStyle(element).getPropertyValue('text-decoration')"
        )
        assert "underline" in text_decoration

        # We'll make sure the 'bold' font weight is more than the
        # default font weight without specifying a specific value
        baseline_font_weight = first_char.evaluate(
            "(element) => getComputedStyle(element).getPropertyValue('font-weight')"
        )

        # Third line should be bold
        third_line = rows.locator("div").nth(2)
        first_char = third_line.locator("span").nth(0)
        font_weight = first_char.evaluate(
            "(element) => getComputedStyle(element).getPropertyValue('font-weight')"
        )
        assert int(font_weight) > int(baseline_font_weight)

        # Fourth line should be italic
        fourth_line = rows.locator("div").nth(3)
        first_char = fourth_line.locator("span").nth(0)
        font_style = first_char.evaluate(
            "(element) => getComputedStyle(element).getPropertyValue('font-style')"
        )
        assert font_style == "italic"
