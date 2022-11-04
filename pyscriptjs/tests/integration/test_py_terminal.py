from .support import PyScriptTest


class TestPyTerminal(PyScriptTest):
    def test_py_terminal(self):
        """
        1. <py-terminal> should redirect stdout and stderr to the DOM

        2. they also go to the console as usual

        3. note that the console also contains PY_COMPLETE, which is a pyodide
           initialization message, but py-terminal doesn't. This is by design
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
        assert self.console.log.lines == [
            self.PY_COMPLETE,
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
