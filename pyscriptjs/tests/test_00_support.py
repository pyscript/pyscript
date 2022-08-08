import textwrap

import pytest

from .support import Error, MultipleErrors, PyScriptTest


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
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
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
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        assert len(self.console.all.messages) == 6
        assert self.console.all.lines == [
            "my log 1",
            "my debug",
            "my info",
            "my error",
            "my warning",
            "my log 2",
        ]

        # fmt: off
        assert self.console.all.text == textwrap.dedent("""
            my log 1
            my debug
            my info
            my error
            my warning
            my log 2
        """).strip()
        # fmt: on

        assert self.console.log.lines == ["my log 1", "my log 2"]
        assert self.console.debug.lines == ["my debug"]

    def test_check_errors(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(Error, match="this is an error"):
            self.check_errors()
        # after a call to check_errors, the errors are cleared
        self.check_errors()

    def test_check_errors_multiple(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('error 1');</script>
            <script>throw new Error('error 2');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(MultipleErrors) as exc:
            self.check_errors()
        assert "error 1" in str(exc.value)
        assert "error 2" in str(exc.value)
        #
        # check that errors are cleared
        self.check_errors()

    def test_wait_for_console(self):
        """
        Test that self.wait_for_console actually waits.
        If it's buggy, the test will try to read self.console.log BEFORE the
        log has been written and it will fail.
        """
        doc = """
        <html>
          <body>
            <script>
                setTimeout(function() {
                    console.log('Page loaded!');
                }, 250);
            </script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        # we use a timeout of 500ms to give plenty of time to the page to
        # actually run the setTimeout callback
        self.wait_for_console("Page loaded!", timeout=500)
        assert self.console.log.lines[-1] == "Page loaded!"
