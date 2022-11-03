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
