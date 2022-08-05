import pytest
import textwrap
from .support import PyScriptTest, Error



class TestSupport(PyScriptTest):
    """
    These are NOT tests about pyscripts.

    They test the PyScriptTest class, i.e. we want to ensure that all the
    testing machinery that we have works correctly.
    """

    def test_basic(self):
        # very basic test, just to check that we can write, serve and read a
        # simple HTML (no pyscript yet)
        doc = """
        <html>
          <body>
            <h1>Hello world</h1>
          </body>
        </html>
        """
        self.write("basic.html", doc)
        self.goto("basic.html")
        content = self.page.content()
        assert "<h1>Hello world</h1>" in content

    def test_console(self):
        """
        Test that we capture console.log messages correctly.
        """
        doc = """
        <html>
          <body>
            <script>
                console.log("my log 1");
                console.debug("my debug");
                console.info("my info");
                console.error("my error");
                console.warn("my warning");
                console.log("my log 2");
            </script>
          </body>
        </html>
        """
        self.write("basic.html", doc)
        self.goto("basic.html")
        assert len(self.console.all.messages) == 6
        assert self.console.all.lines == [
            "my log 1",
            "my debug",
            "my info",
            "my error",
            "my warning",
            "my log 2"
        ]

        assert self.console.all.text == textwrap.dedent("""
            my log 1
            my debug
            my info
            my error
            my warning
            my log 2
        """).strip()

        assert self.console.log.lines == ['my log 1', 'my log 2']
        assert self.console.debug.lines == ['my debug']

    def test_check_errors(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error');</script>
          </body>
        </html>
        """
        self.write("basic.html", doc)
        self.goto("basic.html")
        with pytest.raises(Error, match='this is an error'):
            self.check_errors()
