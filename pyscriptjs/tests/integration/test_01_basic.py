import re

from .support import PyScriptTest


class TestBasic(PyScriptTest):
    def test_pyscript_hello(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello pyscript')
            </py-script>
        """
        )
        # this is a very ugly way of checking the content of the DOM. If we
        # find ourselves to write a lot of code in this style, we will
        # probably want to write a nicer API for it.
        inner_html = self.page.locator("py-script").inner_html()
        pattern = r'<div id="py-.*">hello pyscript</div>'
        assert re.search(pattern, inner_html)

    def test_execution_in_order(self):
        """
        Check that they py-script tags are executed in the same order they are
        defined
        """
        self.pyscript_run(
            """
            <py-script>import js; js.console.log('one')</py-script>
            <py-script>js.console.log('two')</py-script>
            <py-script>js.console.log('three')</py-script>
            <py-script>js.console.log('four')</py-script>
        """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "one",
            "two",
            "three",
            "four",
        ]

    def test_escaping_of_angle_brackets(self):
        """
        Check that py-script tags escape angle brackets
        """
        self.pyscript_run(
            """
            <py-script>import js; js.console.log(1<2, 1>2)</py-script>
            <py-script>js.console.log("<div></div>")</py-script>
        """
        )
        assert self.console.log.lines == [self.PY_COMPLETE, "true false", "<div></div>"]

    def test_paths(self):
        self.writefile("a.py", "x = 'hello from A'")
        self.writefile("b.py", "x = 'hello from B'")
        self.pyscript_run(
            """
            <py-config>
                paths = ["./a.py", "./b.py"]
            </py-config>

            <py-script>
                import js
                import a, b
                js.console.log(a.x)
                js.console.log(b.x)
            </py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello from A",
            "hello from B",
        ]

    def test_paths_that_do_not_exist(self):
        self.pyscript_run(
            """
            <py-config>
                paths = ["./f.py"]
            </py-config>
            """
        )
        assert self.console.error.lines == ["Failed to load resource: net::ERR_FAILED"]
        assert self.console.warning.lines == [
            "Caught an error in fetchPaths:\r\n TypeError: Failed to fetch"
        ]

        errorContent = """PyScript: Access to local files
        (using "Paths:" in &lt;py-config&gt;)
        is not available when directly opening a HTML file;
        you must use a webserver to serve the additional files."""

        inner_html = self.page.locator(".py-error").inner_html()
        assert errorContent in inner_html

    def test_packages(self):
        self.pyscript_run(
            """
            <py-config>
                # we use asciitree because it's one of the smallest packages
                # which are built and distributed with pyodide
                packages = ["asciitree"]
            </py-config>

            <py-script>
                import js
                import asciitree
                js.console.log('hello', asciitree.__name__)
            </py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "Loading asciitree",  # printed by pyodide
            "Loaded asciitree",  # printed by pyodide
            "hello asciitree",  # printed by us
        ]
