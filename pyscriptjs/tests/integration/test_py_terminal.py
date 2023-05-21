import time

from playwright.sync_api import expect

from .support import PyScriptTest, skip_worker


class TestPyTerminal(PyScriptTest):
    def test_py_terminal(self):
        """
        1. <py-terminal> should redirect stdout and stderr to the DOM

        2. they also go to the console as usual
        """
        self.pyscript_run(
            """
            <py-terminal></py-terminal>

            <py-script>
                import sys
                print('hello world')
                print('this goes to stderr', file=sys.stderr)
                print('this goes to stdout')
            </py-script>
            """
        )
        term = self.page.locator("py-terminal")
        term_lines = term.inner_text().splitlines()
        assert term_lines == [
            "hello world",
            "this goes to stderr",
            "this goes to stdout",
        ]
        assert self.console.log.lines[-3:] == [
            "hello world",
            "this goes to stderr",
            "this goes to stdout",
        ]

    @skip_worker("FIXME: js.document")
    def test_two_terminals(self):
        """
        Multiple <py-terminal>s can cohexist.
        A <py-terminal> receives only output from the moment it is added to
        the DOM.
        """
        self.pyscript_run(
            """
            <py-terminal id="term1"></py-terminal>

            <py-script>
                import js
                print('one')
                term2 = js.document.createElement('py-terminal')
                term2.id = 'term2'
                js.document.body.append(term2)

                print('two')
                print('three')
            </py-script>
            """
        )
        term1 = self.page.locator("#term1")
        term2 = self.page.locator("#term2")
        term1_lines = term1.inner_text().splitlines()
        term2_lines = term2.inner_text().splitlines()
        assert term1_lines == ["one", "two", "three"]
        assert term2_lines == ["two", "three"]

    def test_auto_attribute(self):
        self.pyscript_run(
            """
            <py-terminal auto></py-terminal>

            <button id="my-button" py-click="print('hello world')">Click me</button>
            """
        )
        term = self.page.locator("py-terminal")
        expect(term).to_be_hidden()
        self.page.locator("button").click()
        expect(term).to_be_visible()
        assert term.inner_text() == "hello world\n"

    def test_config_auto(self):
        """
        config.terminal == "auto" is the default: a <py-terminal auto> is
        automatically added to the page
        """
        self.pyscript_run(
            """
            <button id="my-button" py-click="print('hello world')">Click me</button>
            """
        )
        term = self.page.locator("py-terminal")
        expect(term).to_be_hidden()
        assert "No <py-terminal> found, adding one" in self.console.info.text
        #
        self.page.locator("button").click()
        expect(term).to_be_visible()
        assert term.inner_text() == "hello world\n"

    def test_config_true(self):
        """
        If we set config.terminal == true, a <py-terminal> is automatically added
        """
        self.pyscript_run(
            """
            <py-config>
                terminal = true
            </py-config>

            <py-script>
                print('hello world')
            </py-script>
            """
        )
        term = self.page.locator("py-terminal")
        expect(term).to_be_visible()
        assert term.inner_text() == "hello world\n"

    def test_config_false(self):
        """
        If we set config.terminal == false, no <py-terminal> is added
        """
        self.pyscript_run(
            """
            <py-config>
                terminal = false
            </py-config>
            """
        )
        term = self.page.locator("py-terminal")
        assert term.count() == 0

    def test_config_docked(self):
        """
        config.docked == "docked" is also the default: a <py-terminal auto docked> is
        automatically added to the page
        """
        self.pyscript_run(
            """
            <button id="my-button" py-click="print('hello world')">Click me</button>
            """
        )
        term = self.page.locator("py-terminal")
        self.page.locator("button").click()
        expect(term).to_be_visible()
        assert term.get_attribute("docked") == ""

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
            <py-config>
                xterm = true
            </py-config>
            <py-script>
                print("\x1b[33mYellow\x1b[0m")
                print("\x1b[4mUnderline\x1b[24m")
                print("\x1b[1mBold\x1b[22m")
                print("\x1b[3mItalic\x1b[23m")
                print("done")
            </py-script>
            """
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

    def test_xterm_multiple(self):
        """Test whether multiple x-terms on the page all function"""
        self.pyscript_run(
            """
            <py-config>
                xterm = true
            </py-config>
            <py-script>
                print("\x1b[33mYellow\x1b[0m")
                print("done")
            </py-script>
            <py-terminal id="a"></py-terminal>
            <py-terminal id="b" data-testid="b"></py-terminal>
            """
        )

        # Wait for "done" to actually appear in the xterm; may be delayed,
        # since xtermjs processes its input buffer in chunks
        last_line = self.page.get_by_test_id("b").get_by_text("done")
        last_line.wait_for()

        # Yes, this is not ideal. See note in `test_xterm_function`
        time.sleep(1)

        rows = self.page.locator("#a .xterm-rows")

        # First line should be yellow
        first_line = rows.locator("div").nth(0)
        first_char = first_line.locator("span").nth(0)
        color = first_char.evaluate(
            "(element) => getComputedStyle(element).getPropertyValue('color')"
        )
        assert color == "rgb(196, 160, 0)"
