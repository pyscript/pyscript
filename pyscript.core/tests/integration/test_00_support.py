import re
import textwrap

import pytest

from .support import (
    PageErrors,
    PageErrorsDidNotRaise,
    PyScriptTest,
    with_execution_thread,
)


@with_execution_thread(None)
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

    def test_await_with_run_js(self):
        self.run_js(
            """
          function resolveAfter200MilliSeconds(x) {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(x);
              }, 200);
            });
          }

          const x = await resolveAfter200MilliSeconds(10);
          console.log(x);
        """
        )

        assert self.console.log.lines[-1] == "10"

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
        with pytest.raises(PageErrors) as exc:
            self.check_js_errors()
        # check that the exception message contains the error message and the
        # stack trace
        msg = str(exc.value)
        expected = textwrap.dedent(
            f"""
            JS errors found: 1
            Error: this is an error
                at {self.http_server_addr}/mytest.html:.*
            """
        ).strip()
        assert re.search(expected, msg)
        #
        # after a call to check_js_errors, the errors are cleared
        self.check_js_errors()
        #
        # JS exceptions are also available in self.console.js_error
        assert self.console.js_error.lines[0].startswith("Error: this is an error")

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

    def test_check_js_errors_expected_but_didnt_raise(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('this is an error 2');</script>
            <script>throw new Error('this is an error 4');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(PageErrorsDidNotRaise) as exc:
            self.check_js_errors(
                "this is an error 1",
                "this is an error 2",
                "this is an error 3",
                "this is an error 4",
            )
        #
        msg = str(exc.value)
        expected = textwrap.dedent(
            """
            The following JS errors were expected but could not be found:
                - this is an error 1
                - this is an error 3
            """
        ).strip()
        assert re.search(expected, msg)

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
        with pytest.raises(PageErrors) as exc:
            self.check_js_errors()
        #
        msg = str(exc.value)
        expected = textwrap.dedent(
            """
            JS errors found: 2
            Error: error 1
                at https://fake_server/mytest.html:.*
            Error: error 2
                at https://fake_server/mytest.html:.*
            """
        ).strip()
        assert re.search(expected, msg)
        #
        # check that errors are cleared
        self.check_js_errors()

    def test_check_js_errors_some_expected_but_others_not(self):
        doc = """
        <html>
          <body>
            <script>throw new Error('expected 1');</script>
            <script>throw new Error('NOT expected 2');</script>
            <script>throw new Error('expected 3');</script>
            <script>throw new Error('NOT expected 4');</script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(PageErrors) as exc:
            self.check_js_errors("expected 1", "expected 3")
        #
        msg = str(exc.value)
        expected = textwrap.dedent(
            """
            JS errors found: 2
            Error: NOT expected 2
                at https://fake_server/mytest.html:.*
            Error: NOT expected 4
                at https://fake_server/mytest.html:.*
            """
        ).strip()
        assert re.search(expected, msg)

    def test_check_js_errors_expected_not_found_but_other_errors(self):
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
        with pytest.raises(PageErrorsDidNotRaise) as exc:
            self.check_js_errors("this is not going to be found")
        #
        msg = str(exc.value)
        expected = textwrap.dedent(
            """
            The following JS errors were expected but could not be found:
                - this is not going to be found
            ---
            The following JS errors were raised but not expected:
            Error: error 1
                at https://fake_server/mytest.html:.*
            Error: error 2
                at https://fake_server/mytest.html:.*
            """
        ).strip()
        assert re.search(expected, msg)

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

    def test_wait_for_console_simple(self):
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
        # we use a timeout of 200ms to give plenty of time to the page to
        # actually run the setTimeout callback
        self.wait_for_console("Page loaded!", timeout=200)
        assert self.console.log.lines[-1] == "Page loaded!"

    def test_wait_for_console_timeout(self):
        doc = """
        <html>
          <body>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(TimeoutError):
            self.wait_for_console("This text will never be printed", timeout=200)

    def test_wait_for_console_dont_wait_if_already_emitted(self):
        """
        If the text is already on the console, wait_for_console() should return
        immediately without waiting.
        """
        doc = """
        <html>
          <body>
            <script>
                console.log('Hello world')
                console.log('Page loaded!');
            </script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        self.wait_for_console("Page loaded!", timeout=200)
        assert self.console.log.lines[-2] == "Hello world"
        assert self.console.log.lines[-1] == "Page loaded!"
        # the following call should return immediately without waiting
        self.wait_for_console("Hello world", timeout=1)

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
        with pytest.raises(PageErrors) as exc:
            self.wait_for_console("Page loaded!", timeout=200)
        assert "this is an error" in str(exc.value)
        assert isinstance(exc.value.__context__, TimeoutError)
        #
        # if we use check_js_errors=False, the error are ignored, but we get the
        # Timeout anyway
        self.goto("mytest.html")
        with pytest.raises(TimeoutError):
            self.wait_for_console("Page loaded!", timeout=200, check_js_errors=False)
        # we still got a PageErrors, so we need to manually clear it, else the
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
        with pytest.raises(PageErrors) as exc:
            self.wait_for_console("Page loaded!", timeout=200)
        assert "this is an error" in str(exc.value)
        #
        # with check_js_errors=False, the Error is ignored and the
        # wait_for_console succeeds
        self.goto("mytest.html")
        self.wait_for_console("Page loaded!", timeout=200, check_js_errors=False)
        # clear the errors, else the test fails at teardown
        self.clear_js_errors()

    def test_wait_for_console_match_substring(self):
        doc = """
        <html>
          <body>
            <script>
                console.log('Foo Bar Baz');
            </script>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        with pytest.raises(TimeoutError):
            self.wait_for_console("Bar", timeout=200)
        #
        self.wait_for_console("Bar", timeout=200, match_substring=True)
        assert self.console.log.lines[-1] == "Foo Bar Baz"

    def test_iter_locator(self):
        doc = """
        <html>
          <body>
              <div>foo</div>
              <div>bar</div>
              <div>baz</div>
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        self.goto("mytest.html")
        divs = self.page.locator("div")
        assert divs.count() == 3
        texts = [el.inner_text() for el in self.iter_locator(divs)]
        assert texts == ["foo", "bar", "baz"]

    def test_smartrouter_cache(self):
        if self.router is None:
            pytest.skip("Cannot test SmartRouter with --dev")

        # this is not an image but who cares, I just want the browser to make
        # an HTTP request
        URL = "https://raw.githubusercontent.com/pyscript/pyscript/main/README.md"
        doc = f"""
        <html>
          <body>
              <img src="{URL}">
          </body>
        </html>
        """
        self.writefile("mytest.html", doc)
        #
        self.router.clear_cache(URL)
        self.goto("mytest.html")
        assert self.router.requests == [
            (200, "fake_server", "https://fake_server/mytest.html"),
            (200, "NETWORK", URL),
        ]
        #
        # let's visit the page again, now it should be cached
        self.goto("mytest.html")
        assert self.router.requests == [
            # 1st visit
            (200, "fake_server", "https://fake_server/mytest.html"),
            (200, "NETWORK", URL),
            # 2nd visit
            (200, "fake_server", "https://fake_server/mytest.html"),
            (200, "CACHED", URL),
        ]

    def test_404(self):
        """
        Test that we capture a 404 in loading a page that does not exist.
        """
        self.goto("this_url_does_not_exist.html")
        assert [
            "Failed to load resource: the server responded with a status of 404 (Not Found)"
        ] == self.console.all.lines
