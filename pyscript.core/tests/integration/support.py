import dataclasses
import functools
import math
import os
import pdb
import re
import sys
import time
import traceback
import urllib
from dataclasses import dataclass

import py
import pytest
import toml
from playwright.sync_api import Error as PlaywrightError

ROOT = py.path.local(__file__).dirpath("..", "..", "..")
BUILD = ROOT.join("pyscript.core").join("dist")


def params_with_marks(params):
    """
    Small helper to automatically apply to each param a pytest.mark with the
    same name of the param itself. E.g.:

        params_with_marks(['aaa', 'bbb'])

    is equivalent to:

        [pytest.param('aaa', marks=pytest.mark.aaa),
         pytest.param('bbb', marks=pytest.mark.bbb)]

    This makes it possible to use 'pytest -m aaa' to run ONLY the tests which
    uses the param 'aaa'.
    """
    return [pytest.param(name, marks=getattr(pytest.mark, name)) for name in params]


def with_execution_thread(*values):
    """
    Class decorator to override config.execution_thread.

    By default, we run each test twice:
      - execution_thread = 'main'
      - execution_thread = 'worker'

    If you want to execute certain tests with only one specific values of
    execution_thread, you can use this class decorator. For example:

    @with_execution_thread('main')
    class TestOnlyMainThread:
        ...

    @with_execution_thread('worker')
    class TestOnlyWorker:
        ...

    If you use @with_execution_thread(None), the logic to inject the
    execution_thread config is disabled.
    """

    if values == (None,):

        @pytest.fixture
        def execution_thread(self, request):
            return None

    else:
        for value in values:
            assert value in ("main", "worker")

        @pytest.fixture(params=params_with_marks(values))
        def execution_thread(self, request):
            return request.param

    def with_execution_thread_decorator(cls):
        cls.execution_thread = execution_thread
        return cls

    return with_execution_thread_decorator


def skip_worker(reason):
    """
    Decorator to skip a test if self.execution_thread == 'worker'
    """
    if callable(reason):
        # this happens if you use @skip_worker instead of @skip_worker("bla bla bla")
        raise Exception(
            "You need to specify a reason for skipping, "
            "please use: @skip_worker('...')"
        )

    def decorator(fn):
        @functools.wraps(fn)
        def decorated(self, *args):
            if self.execution_thread == "worker":
                pytest.skip(reason)
            return fn(self, *args)

        return decorated

    return decorator


def only_main(fn):
    """
    Decorator to mark a test which make sense only in the main thread
    """

    @functools.wraps(fn)
    def decorated(self, *args):
        if self.execution_thread == "worker":
            return
        return fn(self, *args)

    return decorated


def only_worker(fn):
    """
    Decorator to mark a test which make sense only in the worker thread
    """

    @functools.wraps(fn)
    def decorated(self, *args):
        if self.execution_thread != "worker":
            return
        return fn(self, *args)

    return decorated


def filter_inner_text(text, exclude=None):
    return "\n".join(filter_page_content(text.splitlines(), exclude=exclude))


def filter_page_content(lines, exclude=None):
    """Remove lines that are not relevant for the test. By default, ignores:
        ('', 'execution_thread = "main"', 'execution_thread = "worker"')

    Args:
        lines (list): list of strings
        exclude (list): list of strings to exclude

    Returns:
        list: list of strings
    """
    if exclude is None:
        exclude = {"", 'execution_thread = "main"', 'execution_thread = "worker"'}

    return [line for line in lines if line not in exclude]


@pytest.mark.usefixtures("init")
@with_execution_thread("main", "worker")
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

    DEFAULT_TIMEOUT = 30 * 1000

    @pytest.fixture()
    def init(self, request, tmpdir, logger, page, execution_thread):
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
        self.tmpdir.join("favicon.ico").write("")
        self.logger = logger
        self.execution_thread = execution_thread
        self.dev_server = None

        if request.config.option.no_fake_server:
            # use a real HTTP server. Note that as soon as we request the
            # fixture, the server automatically starts in its own thread.
            self.dev_server = request.getfixturevalue("dev_server")
            self.http_server_addr = self.dev_server.base_url
            self.router = None
        else:
            # use the internal playwright routing
            self.http_server_addr = "https://fake_server"
            self.router = SmartRouter(
                "fake_server",
                cache=request.config.cache,
                logger=logger,
                usepdb=request.config.option.usepdb,
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
        page.set_default_timeout(self.DEFAULT_TIMEOUT)
        self.console = ConsoleMessageCollection(self.logger)
        self._js_errors = []
        self._py_errors = []
        page.on("console", self._on_console)
        page.on("pageerror", self._on_pageerror)

    @property
    def headers(self):
        if self.dev_server is None:
            return self.router.headers
        return self.dev_server.RequestHandlerClass.my_headers()

    def disable_cors_headers(self):
        if self.dev_server is None:
            self.router.enable_cors_headers = False
        else:
            self.dev_server.RequestHandlerClass.enable_cors_headers = False

    def run_js(self, code):
        """
        allows top level await to be present in the `code` parameter
        """
        self.page.evaluate(
            """(async () => {
            try {%s}
            catch(e) {
                console.error(e);
            }
            })();"""
            % code
        )

    def teardown_method(self):
        # we call check_js_errors on teardown: this means that if there are still
        # non-cleared errors, the test will fail. If you expect errors in your
        # page and they should not cause the test to fail, you should call
        # self.check_js_errors() in the test itself.
        self.check_js_errors()
        self.check_py_errors()

    def _on_console(self, msg):
        if msg.type == "error" and "Traceback (most recent call last)" in msg.text:
            # this is a Python traceback, let's record it as a py_error
            self._py_errors.append(msg.text)
        self.console.add_message(msg.type, msg.text)

    def _on_pageerror(self, error):
        # apparently, playwright Error.stack contains all the info that we
        # want: exception name, message and stacktrace. The docs say that
        # error.stack is optional, so fallback to the standard repr if it's
        # unavailable.
        error_msg = error.stack or str(error)
        self.console.add_message("js_error", error_msg)
        self._js_errors.append(error_msg)

    def _check_page_errors(self, kind, expected_messages):
        """
        Check whether the page raised any 'JS' or 'Python' error.

        expected_messages is a list of strings of errors that you expect they
        were raised in the page.  They are checked using a simple 'in' check,
        equivalent to this:
            if expected_message in actual_error_message:
                ...

        If an error was expected but not found, it raises PageErrorsDidNotRaise.

        If there are MORE errors other than the expected ones, it raises PageErrors.

        Upon return, all the errors are cleared, so a subsequent call to
        check_{js,py}_errors will not raise, unless NEW errors have been reported
        in the meantime.
        """
        assert kind in ("JS", "Python")
        if kind == "JS":
            actual_errors = self._js_errors[:]
        else:
            actual_errors = self._py_errors[:]
        expected_messages = list(expected_messages)

        for i, msg in enumerate(expected_messages):
            for j, error in enumerate(actual_errors):
                if msg is not None and error is not None and msg in error:
                    # we matched one expected message with an error, remove both
                    expected_messages[i] = None
                    actual_errors[j] = None

        # if everything is find, now expected_messages and actual_errors contains
        # only Nones. If they contain non-None elements, it means that we
        # either have messages which are expected-but-not-found or
        # found-but-not-expected.
        not_found = [msg for msg in expected_messages if msg is not None]
        unexpected = [err for err in actual_errors if err is not None]

        if kind == "JS":
            self.clear_js_errors()
        else:
            self.clear_py_errors()

        if not_found:
            # expected-but-not-found
            raise PageErrorsDidNotRaise(kind, not_found, unexpected)
        if unexpected:
            # found-but-not-expected
            raise PageErrors(kind, unexpected)

    def check_js_errors(self, *expected_messages):
        """
        Check whether JS errors were reported.

        See the docstring for _check_page_errors for more details.
        """
        self._check_page_errors("JS", expected_messages)

    def check_py_errors(self, *expected_messages):
        """
        Check whether Python errors were reported.

        See the docstring for _check_page_errors for more details.
        """
        self._check_page_errors("Python", expected_messages)

    def clear_js_errors(self):
        """
        Clear all JS errors.
        """
        self._js_errors = []

    def clear_py_errors(self):
        self._py_errors = []

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
        url = f"{self.http_server_addr}/{path}"
        self.page.goto(url, timeout=0)

    def wait_for_console(
        self,
        text,
        *,
        match_substring=False,
        timeout=None,
        check_js_errors=True,
    ):
        """
        Wait until the given message appear in the console. If the message was
        already printed in the console, return immediately.

        By default "text" must be the *exact* string as printed by a single
        call to e.g. console.log. If match_substring is True, it is enough
        that the console contains the given text anywhere.

        timeout is expressed in milliseconds. If it's None, it will use
        the same default as playwright, which is 30 seconds.

        If check_js_errors is True (the default), it also checks that no JS
        errors were raised during the waiting.

        Return the elapsed time in ms.
        """
        if match_substring:

            def find_text():
                return text in self.console.all.text

        else:

            def find_text():
                return text in self.console.all.lines

        if timeout is None:
            timeout = self.DEFAULT_TIMEOUT
        # NOTE: we cannot use playwright's own page.expect_console_message(),
        # because if you call it AFTER the text has already been emitted, it
        # waits forever. Instead, we have to use our own custom logic.
        try:
            t0 = time.time()
            while True:
                elapsed_ms = (time.time() - t0) * 1000
                if elapsed_ms > timeout:
                    raise TimeoutError(f"{elapsed_ms:.2f} ms")
                #
                if find_text():
                    # found it!
                    return elapsed_ms
                #
                self.page.wait_for_timeout(50)
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
        scripts = (
            self.page.locator("script[type=py]").all()
            + self.page.locator("py-script").all()
        )
        n_scripts = len(scripts)

        # this is printed by core.js:onAfterRun
        elapsed_ms = self.wait_for_console(
            "---py:all-done---",
            timeout=timeout,
            check_js_errors=check_js_errors,
        )
        self.logger.log(
            "wait_for_pyscript", f"Waited for {elapsed_ms/1000:.2f} s", color="yellow"
        )
        self.page.wait_for_selector("html.all-done")

    SCRIPT_TAG_REGEX = re.compile('(<script type="py"|<py-script)')

    def _pyscript_format(self, snippet, *, execution_thread, extra_head=""):
        if execution_thread == "worker":
            # turn <script type="py"> into <script type="py" worker>, and
            # similarly for <py-script>
            snippet = self.SCRIPT_TAG_REGEX.sub(r"\1 worker", snippet)

        doc = f"""
        <html>
          <head>
              <link rel="stylesheet" href="{self.http_server_addr}/build/core.css">
              <script type="module">
                import {{ config }} from "{self.http_server_addr}/build/core.js";
                globalThis.pyConfig = config.py;
                globalThis.mpyConfig = config.mpy;
                addEventListener(
                  'py:all-done',
                  () => {{
                    console.debug('---py:all-done---');
                    document.documentElement.classList.add('all-done');
                  }},
                  {{ once: true }}
                );
              </script>

              {extra_head}
          </head>
          <body>
            {snippet}
          </body>
        </html>
        """
        return doc

    def pyscript_run(
        self,
        snippet,
        *,
        extra_head="",
        wait_for_pyscript=True,
        timeout=None,
        check_js_errors=True,
    ):
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
        doc = self._pyscript_format(
            snippet,
            execution_thread=self.execution_thread,
            extra_head=extra_head,
        )
        if not wait_for_pyscript and timeout is not None:
            raise ValueError("Cannot set a timeout if wait_for_pyscript=False")
        filename = f"{self.testname}.html"
        self.writefile(filename, doc)
        self.goto(filename)
        if wait_for_pyscript:
            self.wait_for_pyscript(timeout=timeout, check_js_errors=check_js_errors)

    def iter_locator(self, loc):
        """
        Helper method to iterate over all the elements which are matched by a
        locator, since playwright does not seem to support it natively.
        """
        n = loc.count()
        elems = [loc.nth(i) for i in range(n)]
        return iter(elems)

    def assert_no_banners(self):
        """
        Ensure that there are no alert banners on the page, which are used for
        errors and warnings. Raise AssertionError if any if found.
        """
        loc = self.page.locator(".alert-banner")
        n = loc.count()
        if n > 0:
            text = "\n".join(loc.all_inner_texts())
            raise AssertionError(f"Found {n} alert banners:\n" + text)

    def assert_banner_message(self, expected_message):
        """
        Ensure that there is an alert banner on the page with the given message.
        Currently it only handles a single.
        """
        banner = self.page.wait_for_selector(".py-error")
        banner_text = banner.inner_text()

        if expected_message not in banner_text:
            raise AssertionError(
                f"Expected message '{expected_message}' does not "
                f"match banner text '{banner_text}'"
            )
        return True

    def check_tutor_generated_code(self, modules_to_check=None):
        """
        Ensure that the source code viewer injected by the PyTutor plugin
        is presend. Raise AssertionError if not found.

        Args:

            modules_to_check(str): iterable with names of the python modules
                                that have been included in the tutor config
                                and needs to be checked (if they are included
                                in the displayed source code)

        Returns:
            None
        """
        # Given: a page that has a <py-tutor> tag
        assert self.page.locator("py-tutor").count()

        # EXPECT that"
        #
        # the page has the "view-code-button"
        view_code_button = self.page.locator("#view-code-button")
        vcb_count = view_code_button.count()
        if vcb_count != 1:
            raise AssertionError(
                f"Found {vcb_count} code view button. Should have been 1!"
            )

        # the page has the code-section element
        code_section = self.page.locator("#code-section")
        code_section_count = code_section.count()
        code_msg = (
            f"One (and only one) code section should exist. Found: {code_section_count}"
        )
        assert code_section_count == 1, code_msg

        pyconfig_tag = self.page.locator("py-config")
        code_section_inner_html = code_section.inner_html()

        # the code_section has the index.html section
        assert "<p>index.html</p>" in code_section_inner_html

        # the section has the tags highlighting the HTML code
        assert (
            '<pre class="prism-code language-html" tabindex="0">'
            '    <code class="language-html">' in code_section_inner_html
        )

        # if modules were included, these are also presented in the code section
        if modules_to_check:
            for module in modules_to_check:
                assert f"{module}" in code_section_inner_html

        # the section also includes the config
        assert "&lt;</span>py-config</span>" in code_section_inner_html

        # the contents of the py-config tag are included in the code section
        assert pyconfig_tag.inner_html() in code_section_inner_html

        # the code section to be invisible by default (by having the hidden class)
        assert "code-section-hidden" in code_section.get_attribute("class")

        # once the view_code_button is pressed, the code section becomes visible
        view_code_button.click()
        assert "code-section-visible" in code_section.get_attribute("class")


# ============== Helpers and utility functions ==============

MAX_TEST_TIME = 30  # Number of seconds allowed for checking a testing condition
TEST_TIME_INCREMENT = 0.25  # 1/4 second, the length of each iteration
TEST_ITERATIONS = math.ceil(
    MAX_TEST_TIME / TEST_TIME_INCREMENT
)  # 120 iters of 1/4 second


def wait_for_render(page, selector, pattern, timeout_seconds=None):
    """
    Assert that rendering inserts data into the page as expected: search the
    DOM from within the timing loop for a string that is not present in the
    initial markup but should appear by way of rendering
    """
    re_sub_content = re.compile(pattern)
    py_rendered = False  # Flag to be set to True when condition met

    if timeout_seconds:
        check_iterations = math.ceil(timeout_seconds / TEST_TIME_INCREMENT)
    else:
        check_iterations = TEST_ITERATIONS

    for _ in range(check_iterations):
        content = page.inner_html(selector)
        if re_sub_content.search(content):
            py_rendered = True
            break
        time.sleep(TEST_TIME_INCREMENT)

    assert py_rendered  # nosec


class PageErrors(Exception):
    """
    Represent one or more exceptions which happened in JS or Python.
    """

    def __init__(self, kind, errors):
        assert kind in ("JS", "Python")
        n = len(errors)
        assert n != 0
        lines = [f"{kind} errors found: {n}"]
        lines += errors
        msg = "\n".join(lines)
        super().__init__(msg)
        self.errors = errors


class PageErrorsDidNotRaise(Exception):
    """
    Exception raised by check_{js,py}_errors when the expected JS or Python
    error messages are not found.
    """

    def __init__(self, kind, expected_messages, errors):
        assert kind in ("JS", "Python")
        lines = [f"The following {kind} errors were expected but could not be found:"]
        for msg in expected_messages:
            lines.append("    - " + msg)
        if errors:
            lines.append("---")
            lines.append(f"The following {kind} errors were raised but not expected:")
            lines += errors
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
        line = f"[{delta:6.2f} {category:17}] {text}"
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

        def asdict(self):
            return dataclasses.asdict(self)

        @classmethod
        def fromdict(cls, d):
            return cls(**d)

    def __init__(self, fake_server, *, cache, logger, usepdb=False):
        """
        fake_server: the domain name of the fake server
        """
        self.fake_server = fake_server
        self.cache = cache  # this is pytest-cache, it survives across sessions
        self.logger = logger
        self.usepdb = usepdb
        self.page = None
        self.requests = []  # (status, kind, url)
        self.enable_cors_headers = True

    @property
    def headers(self):
        if self.enable_cors_headers:
            return {
                "Cross-Origin-Embedder-Policy": "require-corp",
                "Cross-Origin-Opener-Policy": "same-origin",
            }
        return {}

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
        self.requests.append((status, kind, url))
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
            if os.path.exists(relative_path):
                route.fulfill(status=200, headers=self.headers, path=relative_path)
            else:
                route.fulfill(status=404, headers=self.headers)
            return

        # network requests might be cached
        resp = self.fetch_from_cache(full_url)
        if resp is not None:
            kind = "CACHED"
        else:
            kind = "NETWORK"
            resp = self.fetch_from_network(route.request)
            self.save_resp_to_cache(full_url, resp)

        self.log_request(resp.status, kind, full_url)
        route.fulfill(status=resp.status, headers=resp.headers, body=resp.body)

    def clear_cache(self, url):
        key = "pyscript/" + url
        self.cache.set(key, None)

    def save_resp_to_cache(self, url, resp):
        key = "pyscript/" + url
        data = resp.asdict()
        # cache.set encodes it as JSON, and "bytes" are not supported: let's
        # encode them as latin-1
        data["body"] = data["body"].decode("latin-1")
        self.cache.set(key, data)

    def fetch_from_cache(self, url):
        key = "pyscript/" + url
        data = self.cache.get(key, None)
        if data is None:
            return None
        # see the corresponding comment in save_resp_to_cache
        data["body"] = data["body"].encode("latin-1")
        return self.CachedResponse(**data)

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
