import pdb
import re
import sys
import time
import traceback
import urllib
from dataclasses import dataclass

import py
import pytest
from playwright.sync_api import Error as PlaywrightError

ROOT = py.path.local(__file__).dirpath("..", "..", "..")
BUILD = ROOT.join("pyscriptjs", "build")


@pytest.mark.usefixtures("init")
class PyScriptTest:
    """
    Base class to write PyScript integration tests, based on playwright.

    It provides a simple API to generate HTML files and load them in
    playwright.

    It also provides a Pythonic API on top of playwright for the most
    common tasks; in particular:

      - self.console collects all the JS console.* messages. Look at the doc
        of ConsoleMessageCollection for more details.

      - self.check_js_errors() checks that no JS errors have been thrown

      - after each test, self.check_js_errors() is automatically run to ensure
        that no JS error passes uncaught.

      - self.wait_for_console waits until the specified message appears in the
        console

      - self.wait_for_pyscript waits until all the PyScript tags have been
        evaluated

      - self.pyscript_run is the main entry point for pyscript tests: it
        creates an HTML page to run the specified snippet.
    """

    # Pyodide always print()s this message upon initialization. Make it
    # available to all tests so that it's easiert to check.
    PY_COMPLETE = "Python initialization complete"

    @pytest.fixture()
    def init(self, request, tmpdir, logger, page):
        """
        Fixture to automatically initialize all the tests in this class and its
        subclasses.

        The magic is done by the decorator @pytest.mark.usefixtures("init"),
        which tells pytest to automatically use this fixture for all the test
        method of this class.

        Using the standard pytest behavior, we can request more fixtures:
        tmpdir, and page; 'page' is a fixture provided by pytest-playwright.

        Then, we save these fixtures on the self and proceed with more
        initialization. The end result is that the requested fixtures are
        automatically made available as self.xxx in all methods.
        """
        self.testname = request.function.__name__.replace("test_", "")
        self.tmpdir = tmpdir
        # create a symlink to BUILD inside tmpdir
        tmpdir.join("build").mksymlinkto(BUILD)
        self.tmpdir.chdir()
        self.logger = logger

        if request.config.option.no_fake_server:
            # use a real HTTP server. Note that as soon as we request the
            # fixture, the server automatically starts in its own thread.
            self.http_server = request.getfixturevalue("http_server")
        else:
            # use the internal playwright routing
            self.http_server = "http://fake_server"
            self.router = SmartRouter(
                "fake_server", logger=logger, usepdb=request.config.option.usepdb
            )
            self.router.install(page)
        #
        self.init_page(page)
        #
        # this extra print is useful when using pytest -s, else we start printing
        # in the middle of the line
        print()
        #
        # if you use pytest --headed you can see the browser page while
        # playwright executes the tests, but the page is closed very quickly
        # as soon as the test finishes. To avoid that, we automatically start
        # a pdb so that we can wait as long as we want.
        yield
        if request.config.option.headed:
            pdb.Pdb.intro = (
                "\n"
                "This (Pdb) was started automatically because you passed --headed:\n"
                "the execution of the test pauses here to give you the time to inspect\n"
                "the browser. When you are done, type one of the following commands:\n"
                "    (Pdb) continue\n"
                "    (Pdb) cont\n"
                "    (Pdb) c\n"
            )
            pdb.set_trace()

    def init_page(self, page):
        self.page = page

        # set default timeout to 60000 millliseconds from 30000
        page.set_default_timeout(60000)

        self.console = ConsoleMessageCollection(self.logger)
        self._js_errors = []
        page.on("console", self._on_console)
        page.on("pageerror", self._on_pageerror)

    def teardown_method(self):
        # we call check_js_errors on teardown: this means that if there are still
        # non-cleared errors, the test will fail. If you expect errors in your
        # page and they should not cause the test to fail, you should call
        # self.check_js_errors() in the test itself.
        self.check_js_errors()

    def _on_console(self, msg):
        self.console.add_message(msg.type, msg.text)

    def _on_pageerror(self, error):
        self.console.add_message("js_error", error.stack)
        self._js_errors.append(error)

    def check_js_errors(self, *expected_messages):
        """
        Check whether JS errors were reported.

        expected_messages is a list of strings of errors that you expect they
        were raised in the page.  They are checked using a simple 'in' check,
        equivalent to this:
            if expected_message in actual_error_message:
                ...

        If an error was expected but not found, it raises
        DidNotRaiseJsError().

        If there are MORE errors other than the expected ones, it raises JsErrors.

        Upon return, all the errors are cleared, so a subsequent call to
        check_js_errors will not raise, unless NEW JS errors have been reported
        in the meantime.
        """
        expected_messages = list(expected_messages)
        js_errors = self._js_errors[:]

        for i, msg in enumerate(expected_messages):
            for j, error in enumerate(js_errors):
                if msg is not None and error is not None and msg in error.message:
                    # we matched one expected message with an error, remove both
                    expected_messages[i] = None
                    js_errors[j] = None

        # if everything is find, now expected_messages and js_errors contains
        # only Nones. If they contain non-None elements, it means that we
        # either have messages which are expected-but-not-found or errors
        # which are found-but-not-expected.
        expected_messages = [msg for msg in expected_messages if msg is not None]
        js_errors = [err for err in js_errors if err is not None]
        self.clear_js_errors()

        if expected_messages:
            # expected-but-not-found
            raise JsErrorsDidNotRaise(expected_messages, js_errors)

        if js_errors:
            # found-but-not-expected
            raise JsErrors(js_errors)

    def clear_js_errors(self):
        """
        Clear all JS errors.
        """
        self._js_errors = []

    def writefile(self, filename, content):
        """
        Very thin helper to write a file in the tmpdir
        """
        f = self.tmpdir.join(filename)
        f.dirpath().ensure(dir=True)
        f.write(content)

    def goto(self, path):
        self.logger.reset()
        self.logger.log("page.goto", path, color="yellow")
        url = f"{self.http_server}/{path}"
        self.page.goto(url, timeout=0)

    def wait_for_console(self, text, *, timeout=None, check_js_errors=True):
        """
        Wait until the given message appear in the console.

        Note: it must be the *exact* string as printed by e.g. console.log.
        If you need more control on the predicate (e.g. if you want to match a
        substring), use self.page.expect_console_message directly.

        timeout is expressed in milliseconds. If it's None, it will use
        playwright's own default value, which is 30 seconds).

        If check_js_errors is True (the default), it also checks that no JS
        errors were raised during the waiting.
        """
        pred = lambda msg: msg.text == text
        try:
            with self.page.expect_console_message(pred, timeout=timeout):
                pass
        finally:
            # raise JsError if there were any javascript exception. Note that
            # this might happen also in case of a TimeoutError. In that case,
            # the JsError will shadow the TimeoutError but this is correct,
            # because it's very likely that the console message never appeared
            # precisely because of the exception in JS.
            if check_js_errors:
                self.check_js_errors()

    def wait_for_pyscript(self, *, timeout=None, check_js_errors=True):
        """
        Wait until pyscript has been fully loaded.

        Timeout is expressed in milliseconds. If it's None, it will use
        playwright's own default value, which is 30 seconds).

        If check_js_errors is True (the default), it also checks that no JS
        errors were raised during the waiting.
        """
        # this is printed by runtime.ts:Runtime.initialize
        self.wait_for_console(
            "[pyscript/main] PyScript page fully initialized",
            timeout=timeout,
            check_js_errors=check_js_errors,
        )
        # We still don't know why this wait is necessary, but without it
        # events aren't being triggered in the tests.
        self.page.wait_for_timeout(100)

    def pyscript_run(self, snippet, *, extra_head="", wait_for_pyscript=True):
        """
        Main entry point for pyscript tests.

        snippet contains a fragment of HTML which will be put inside a full
        HTML document. In particular, the <head> automatically contains the
        correct <script> and <link> tags which are necessary to load pyscript
        correctly.

        This method does the following:
          - write a full HTML file containing the snippet
          - open a playwright page for it
          - wait until pyscript has been fully loaded
        """
        doc = f"""
        <html>
          <head>
              <link rel="stylesheet" href="{self.http_server}/build/pyscript.css" />
              <script defer src="{self.http_server}/build/pyscript.js"></script>
              {extra_head}
          </head>
          <body>
            {snippet}
          </body>
        </html>
        """
        filename = f"{self.testname}.html"
        self.writefile(filename, doc)
        self.goto(filename)
        if wait_for_pyscript:
            self.wait_for_pyscript()


# ============== Helpers and utility functions ==============


class JsErrors(Exception):
    """
    Represent one or more exceptions which happened in JS.

    It's a thin wrapper around playwright.sync_api.Error, with two important
    differences:

    1. it has a better name: if you see JsError in a traceback, it's
       immediately obvious that it's a JS exception.

    2. Show also the JS stacktrace by default, contrarily to
       playwright.sync_api.Error
    """

    def __init__(self, errors):
        n = len(errors)
        assert n != 0
        lines = [f"JS errors found: {n}"]
        for err in errors:
            lines.append(self.format_playwright_error(err))
        msg = "\n".join(lines)
        super().__init__(msg)
        self.errors = errors

    @staticmethod
    def format_playwright_error(error):
        # apparently, playwright Error.stack contains all the info that we
        # want: exception name, message and stacktrace. The docs say that
        # error.stack is optional, so fallback to the standard repr if it's
        # unavailable.
        return error.stack or str(error)


class JsErrorsDidNotRaise(Exception):
    """
    Exception raised by check_js_errors when the expected JS error messages
    are not found.
    """

    def __init__(self, expected_messages, errors):
        lines = ["The following JS errors were expected but could not be found:"]
        for msg in expected_messages:
            lines.append("    - " + msg)
        if errors:
            lines.append("---")
            lines.append("The following JS errors were raised but not expected:")
            for err in errors:
                lines.append(JsErrors.format_playwright_error(err))
        msg = "\n".join(lines)
        super().__init__(msg)
        self.expected_messages = expected_messages
        self.errors = errors


class ConsoleMessageCollection:
    """
    Helper class to collect and expose ConsoleMessage in a Pythonic way.

    Usage:

      console.log.messages: list of ConsoleMessage with type=='log'
      console.log.lines:    list of strings
      console.log.text:     the whole text as single string

      console.debug.*       same as above, but with different types
      console.info.*
      console.error.*
      console.warning.*

      console.js_error.*    this is a special category which does not exist in the
                            browser: it prints uncaught JS exceptions

      console.all.*         same as the individual categories but considering
                            all messages which were sent to the console
    """

    @dataclass
    class Message:
        type: str  # 'log', 'info', 'debug', etc.
        text: str

    class View:
        """
        Filter console messages by the given msg_type
        """

        def __init__(self, console, msg_type):
            self.console = console
            self.msg_type = msg_type

        @property
        def messages(self):
            if self.msg_type is None:
                return self.console._messages
            else:
                return [
                    msg for msg in self.console._messages if msg.type == self.msg_type
                ]

        @property
        def lines(self):
            return [msg.text for msg in self.messages]

        @property
        def text(self):
            return "\n".join(self.lines)

    _COLORS = {
        "warning": "brown",
        "error": "darkred",
        "js_error": "red",
    }

    def __init__(self, logger):
        self.logger = logger
        self._messages = []
        self.all = self.View(self, None)
        self.log = self.View(self, "log")
        self.debug = self.View(self, "debug")
        self.info = self.View(self, "info")
        self.error = self.View(self, "error")
        self.warning = self.View(self, "warning")
        self.js_error = self.View(self, "js_error")

    def add_message(self, type, text):
        # log the message: pytest will capture the output and display the
        # messages if the test fails.
        msg = self.Message(type=type, text=text)
        category = f"console.{msg.type}"
        color = self._COLORS.get(msg.type)
        self.logger.log(category, msg.text, color=color)
        self._messages.append(msg)


class Logger:
    """
    Helper class to log messages to stdout.

    Features:
      - nice formatted category
      - keep track of time passed since the last reset
      - support colors

    NOTE: the (lowercase) logger fixture is defined in conftest.py
    """

    def __init__(self):
        self.reset()
        # capture things like [pyscript/main]
        self.prefix_regexp = re.compile(r"(\[.+?\])")

    def reset(self):
        self.start_time = time.time()

    def colorize_prefix(self, text, *, color):
        # find the first occurrence of something like [pyscript/main] and
        # colorize it
        start, end = Color.escape_pair(color)
        return self.prefix_regexp.sub(rf"{start}\1{end}", text, 1)

    def log(self, category, text, *, color=None):
        delta = time.time() - self.start_time
        text = self.colorize_prefix(text, color="teal")
        line = f"[{delta:6.2f} {category:16}] {text}"
        if color:
            line = Color.set(color, line)
        print(line)


class Color:
    """
    Helper method to print colored output using ANSI escape codes.
    """

    black = "30"
    darkred = "31"
    darkgreen = "32"
    brown = "33"
    darkblue = "34"
    purple = "35"
    teal = "36"
    lightgray = "37"
    darkgray = "30;01"
    red = "31;01"
    green = "32;01"
    yellow = "33;01"
    blue = "34;01"
    fuchsia = "35;01"
    turquoise = "36;01"
    white = "37;01"

    @classmethod
    def set(cls, color, string):
        start, end = cls.escape_pair(color)
        return f"{start}{string}{end}"

    @classmethod
    def escape_pair(cls, color):
        try:
            color = getattr(cls, color)
        except AttributeError:
            pass
        start = f"\x1b[{color}m"
        end = "\x1b[00m"
        return start, end


class SmartRouter:
    """
    A smart router to be used in conjunction with playwright.Page.route.

    Main features:

      - it intercepts the requests to a local "fake server" and serve them
        statically from disk

      - it intercepts the requests to the network and cache the results
        locally
    """

    @dataclass
    class CachedResponse:
        """
        We cannot put playwright's APIResponse instances inside _cache, because
        they are valid only in the context of the same page. As a workaround,
        we manually save status, headers and body of each cached response.
        """

        status: int
        headers: dict
        body: str

    # NOTE: this is a class attribute, which means that the cache is
    # automatically shared between all instances of Fake_Server (and thus all
    # tests of the pytest session)
    _cache = {}

    def __init__(self, fake_server, *, logger, usepdb=False):
        """
        fake_server: the domain name of the fake server
        """
        self.fake_server = fake_server
        self.logger = logger
        self.usepdb = usepdb
        self.page = None

    def install(self, page):
        """
        Install the smart router on a page
        """
        self.page = page
        self.page.route("**", self.router)

    def router(self, route):
        """
        Intercept and fulfill playwright requests.

        NOTE!
        If we raise an exception inside router, playwright just hangs and the
        exception seems not to be propagated outside. It's very likely a
        playwright bug.

        This means that for example pytest doesn't have any chance to
        intercept the exception and fail in a meaningful way.

        As a workaround, we try to intercept exceptions by ourselves, print
        something reasonable on the console and abort the request (hoping that
        the test will fail cleaninly, that's the best we can do). We also try
        to respect pytest --pdb, for what it's possible.
        """
        try:
            return self._router(route)
        except Exception:
            print("***** Error inside Fake_Server.router *****")
            info = sys.exc_info()
            print(traceback.format_exc())
            if self.usepdb:
                pdb.post_mortem(info[2])
            route.abort()

    def log_request(self, status, kind, url):
        color = "blue" if status == 200 else "red"
        self.logger.log("request", f"{status} - {kind} - {url}", color=color)

    def _router(self, route):
        full_url = route.request.url
        url = urllib.parse.urlparse(full_url)
        assert url.scheme in ("http", "https")

        # requests to http://fake_server/ are served from the current dir and
        # never cached
        if url.netloc == self.fake_server:
            self.log_request(200, "fake_server", full_url)
            assert url.path[0] == "/"
            relative_path = url.path[1:]
            route.fulfill(status=200, path=relative_path)
            return

        # network requests might be cached
        if full_url in self._cache:
            kind = "CACHED"
            resp = self._cache[full_url]
        else:
            kind = "NETWORK"
            resp = self.fetch_from_network(route.request)
            self._cache[full_url] = resp

        self.log_request(resp.status, kind, full_url)
        route.fulfill(status=resp.status, headers=resp.headers, body=resp.body)

    def fetch_from_network(self, request):
        # sometimes the network is flaky and if the first request doesn't
        # work, a subsequent one works. Instead of giving up immediately,
        # let's try twice
        try:
            api_response = self.page.request.fetch(request)
        except PlaywrightError:
            # sleep a bit and try again
            time.sleep(0.5)
            api_response = self.page.request.fetch(request)

        cached_response = self.CachedResponse(
            status=api_response.status,
            headers=api_response.headers,
            body=api_response.body(),
        )
        return cached_response
