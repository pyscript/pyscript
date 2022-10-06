import hashlib
import pdb
import re
import time

import py
import pytest
from playwright._impl._api_types import Error as PlaywrightRequestError
from utils import retry

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

      - self.check_errors() checks that no JS errors have been thrown

      - after each test, self.check_errors() is automatically run to ensure
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
        tmpdir, http_server and page; 'page' is a fixture provided by
        pytest-playwright.

        Then, we save these fixtures on the self and proceed with more
        initialization. The end result is that the requested fixtures are
        automatically made available as self.xxx in all methods.
        """
        self.testname = request.function.__name__.replace("test_", "")
        self.tmpdir = tmpdir
        # create a symlink to BUILD inside tmpdir
        tmpdir.join("build").mksymlinkto(BUILD)
        self.tmpdir.chdir()
        self.http_server = "http://localhost:8080"
        self.logger = logger
        self.init_page(page, request.config.option.headed)
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

    def init_page(self, page, headed):
        self.page = page

        # set default timout to 60000 millliseconds from 30000
        page.set_default_timeout(60000)
        
        # cache storing request objects by a key computed as the sha256 of the url
        cache = {}

        # router to cache with fail 2x on requests

        def router(route):
            # hash of url
            hash = hashlib.sha256(route.request.url.encode("utf-8")).hexdigest()

            @retry(times=2, exceptions=(PlaywrightRequestError,))
            def fetch_and_put_in_cache():

                response = page.request.fetch(route.request)
                cache[hash] = response
                route.fulfill(status=200, response=response)

            # cached?
            if hash in cache:
                # fulfill via cache
                route.fulfill(status=200, response=cache.get(hash))
            else:
                # from pyodide zip in temp dir
                if route.request.url.startswith(f"{self.http_server}/pyodide/"):
                    path_url = route.request.url[21:]
                    route.fulfill(
                        status=200,
                        path=self.tmpdir + path_url,
                    )
                # from examples dir
                elif route.request.url.startswith(f"{self.http_server}/"):
                    path_url = route.request.url[22:]
                    route.fulfill(
                        status=200,
                        path=path_url,
                    )
                # remote file
                else:
                    fetch_and_put_in_cache()

        # route all urls through router
        if not headed:
            self.page.route("**", router)
        self.console = ConsoleMessageCollection(self.logger)
        self._page_errors = []
        page.on("console", self.console.add_message)
        page.on("pageerror", self._on_pageerror)

    def teardown_method(self):
        # we call check_errors on teardown: this means that if there are still
        # non-cleared errors, the test will fail. If you expect errors in your
        # page and they should not cause the test to fail, you should call
        # self.check_errors() in the test itself.
        self.check_errors()

    def _on_pageerror(self, error):
        self.logger.log("JS exception", error.stack, color="red")
        self._page_errors.append(error)

    def check_errors(self):
        """
        Check whether JS errors were reported.

        If it finds a single JS error, raise JsError.
        If it finds multiple JS errors, raise JsMultipleErrors.

        Upon return, all the errors are cleared, so a subsequent call to
        check_errors will not raise, unless NEW JS errors have been reported
        in the meantime.
        """
        exc = None
        if len(self._page_errors) == 1:
            # if there is a single error, wrap it
            exc = JsError(self._page_errors[0])
        elif len(self._page_errors) >= 2:
            exc = JsMultipleErrors(self._page_errors)
        self._page_errors = []
        if exc:
            raise exc

    def clear_errors(self):
        """
        Clear all JS errors.
        """
        self._page_errors = []

    def writefile(self, filename, content):
        """
        Very thin helper to write a file in the tmpdir
        """
        f = self.tmpdir.join(filename)
        f.write(content)

    def goto(self, path):
        self.logger.reset()
        self.logger.log("page.goto", path, color="yellow")
        url = f"{self.http_server}/{path}"
        self.page.goto(url,timeout=0)

    def wait_for_console(self, text, *, timeout=None, check_errors=True):
        """
        Wait until the given message appear in the console.

        Note: it must be the *exact* string as printed by e.g. console.log.
        If you need more control on the predicate (e.g. if you want to match a
        substring), use self.page.expect_console_message directly.

        timeout is expressed in milliseconds. If it's None, it will use
        playwright's own default value, which is 30 seconds).

        If check_errors is True (the default), it also checks that no JS
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
            if check_errors:
                self.check_errors()

    def wait_for_pyscript(self, *, timeout=None, check_errors=True):
        """
        Wait until pyscript has been fully loaded.

        Timeout is expressed in milliseconds. If it's None, it will use
        playwright's own default value, which is 30 seconds).

        If check_errors is True (the default), it also checks that no JS
        errors were raised during the waiting.
        """
        # this is printed by runtime.ts:Runtime.initialize
        self.wait_for_console(
            "[pyscript/runtime] PyScript page fully initialized",
            timeout=timeout,
            check_errors=check_errors,
        )
        # We still don't know why this wait is necessary, but without it
        # events aren't being triggered in the tests.
        self.page.wait_for_timeout(100)

    def pyscript_run(self, snippet, *, extra_head=""):
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
        self.wait_for_pyscript()


# ============== Helpers and utility functions ==============


class JsError(Exception):
    """
    Represent an exception which happened in JS.

    It's a thin wrapper around playwright.sync_api.Error, with two important
    differences:

    1. it has a better name: if you see JsError in a traceback, it's
       immediately obvious that it's a JS exception.

    2. Show also the JS stacktrace by default, contrarily to
       playwright.sync_api.Error
    """

    def __init__(self, error):
        super().__init__(self.format_playwright_error(error))
        self.error = error

    @staticmethod
    def format_playwright_error(error):
        # apparently, playwright Error.stack contains all the info that we
        # want: exception name, message and stacktrace. The docs say that
        # error.stack is optional, so fallback to the standard repr if it's
        # unavailable.
        return error.stack or str(error)


class JsMultipleErrors(Exception):
    """
    This is raised in case we get multiple JS errors in the page
    """

    def __init__(self, errors):
        lines = ["Multiple JS errors found:"]
        for err in errors:
            lines.append(JsError.format_playwright_error(err))
        msg = "\n".join(lines)
        super().__init__(msg)
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

      console.all.*         same as above, but considering all messages, no filters
    """

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
        "error": "red",
        "warning": "brown",
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

    def add_message(self, msg):
        # log the message: pytest will capute the output and display the
        # messages if the test fails.
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
        line = f"[{delta:6.2f} {category:15}] {text}"
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
