import re
import textwrap

import pytest
from playwright import sync_api

from .support import JsErrors, PyScriptTest


class TestSupport(PyScriptTest):
    """
    These are NOT tests about PyScript.

    They test the PyScriptTest class, i.e. we want to ensure that all the
    testing machinery that we have works correctly.
    """

    def test_basic(self):
        """
        Very basic test, just to check that we can write, serve and read a simple
        HTML (no pyscript yet)
        """
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

    def test_check_js_errors_simple(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(JsErrors) as exc:
            self.check_js_errors()
        # check that the exception message contains the error message and the
        # stack trace
        msg = str(exc.value)
        expected = textwrap.dedent(
            """
            JS errors found: 1
            Error: this is an error
                at http://fake_server/mytest.html:.*
            """
        ).strip()
        assert re.search(expected, msg)
        #
        # after a call to check_js_errors, the errors are cleared
        self.check_js_errors()

    def test_check_js_errors_expected(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        self.check_js_errors("this is an error")

    def test_check_js_errors_multiple(self):
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
        with pytest.raises(JsErrors) as exc:
            self.check_js_errors()
        #
        msg = str(exc.value)
        expected = textwrap.dedent(
            """
            JS errors found: 2
            Error: error 1
                at http://fake_server/mytest.html:.*
            Error: error 2
                at http://fake_server/mytest.html:.*
            """
        ).strip()
        assert re.search(expected, msg)
        #
        # check that errors are cleared
        self.check_js_errors()

    def test_clear_js_errors(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        self.clear_js_errors()
        # self.check_js_errors does not raise, because the errors have been
        # cleared
        self.check_js_errors()

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
                }, 100);
            </script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        # we use a timeout of 500ms to give plenty of time to the page to
        # actually run the setTimeout callback
        self.wait_for_console("Page loaded!", timeout=200)
        assert self.console.log.lines[-1] == "Page loaded!"

    def test_wait_for_console_exception_1(self):
        """
        Test that if a JS exception is raised while waiting for the console, we
        report the exception and not the timeout.

        There are two main cases:
           1. there is an exception and the console message does not appear
           2. there is an exception but the console message appears anyway

        This test checks for case 1. Case 2 is tested by
        test_wait_for_console_exception_2
        """
        # case 1: there is an exception and the console message does not appear
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        # "Page loaded!" will never appear, of course.
        self.goto("mytest.html")
        with pytest.raises(JsErrors) as exc:
            self.wait_for_console("Page loaded!", timeout=200)
        assert "this is an error" in str(exc.value)
        assert isinstance(exc.value.__context__, sync_api.TimeoutError)
        #
        # if we use check_js_errors=False, the error are ignored, but we get the
        # Timeout anyway
        self.goto("mytest.html")
        with pytest.raises(sync_api.TimeoutError):
            self.wait_for_console("Page loaded!", timeout=200, check_js_errors=False)
        # we still got a JsErrors, so we need to manually clear it, else the
        # test fails at teardown
        self.clear_js_errors()

    def test_wait_for_console_exception_2(self):
        """
        See the description in test_wait_for_console_exception_1.
        """
        # case 2: there is an exception, but the console message appears
        doc = """
        <html>
          <body>
            <script>
                setTimeout(function() {
                    console.log('Page loaded!');
                }, 100);
                throw new Error('this is an error');
            </script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(JsErrors) as exc:
            self.wait_for_console("Page loaded!", timeout=200)
        assert "this is an error" in str(exc.value)
        #
        # with check_js_errors=False, the Error is ignored and the
        # wait_for_console succeeds
        self.goto("mytest.html")
        self.wait_for_console("Page loaded!", timeout=200, check_js_errors=False)
        # clear the errors, else the test fails at teardown
        self.clear_js_errors()
