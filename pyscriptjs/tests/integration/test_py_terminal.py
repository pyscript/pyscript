from playwright.sync_api import expect

from .support import PyScriptTest


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
