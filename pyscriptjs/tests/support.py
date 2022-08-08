import py
import pytest
from playwright.sync_api import Error  # noqa: F401

ROOT = py.path.local(__file__).dirpath("..", "..")
BUILD = ROOT.join("pyscriptjs", "build")


class MultipleErrors(Exception):
    """
    This is raised in case we get multiple JS errors in the page
    """

    def __init__(self, errors):
        lines = ["Multiple JS errors found:"]
        for err in errors:
            lines.append(repr(err))
        msg = "\n".join(lines)
        super().__init__(msg)
        self.errors = errors


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
    """

    @pytest.fixture()
    def init(self, tmpdir, http_server, page):
        self.tmpdir = tmpdir
        # create a symlink to BUILD inside tmpdir
        tmpdir.join("build").mksymlinkto(BUILD)
        self.http_server = http_server
        self.tmpdir.chdir()
        self.init_page(page)

    def init_page(self, page):
        self.page = page
        self.console = ConsoleMessageCollection()
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
        line = f"[JS exception   ] {error.stack}"
        print(Color.set("red", line))
        self._page_errors.append(error)

    def check_errors(self):
        if len(self._page_errors) == 0:
            return
        elif len(self._page_errors) == 1:
            # if there is a single error, just raise it
            exc = self._page_errors.pop()
            raise exc
        else:
            errors = self._page_errors
            self._page_errors = []
            raise MultipleErrors(errors)

    def writefile(self, filename, content):
        """
        Very thin helper to write a file in the tmpdir
        """
        f = self.tmpdir.join(filename)
        f.write(content)

    def goto(self, path):
        url = f"{self.http_server}/{path}"
        self.page.goto(url)

    def wait_for_console(self, text, *, timeout=None):
        """
        Wait until the given message appear in the console.

        Note: it must be the *exact* string as printed by e.g. console.log.
        If you need more control on the predicate (e.g. if you want to match a
        substring), use self.page.expect_console_message directly.
        """
        with self.page.expect_console_message(lambda msg: msg.text == text):
            pass


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

    def __init__(self):
        self._messages = []
        self.all = self.View(self, None)
        self.log = self.View(self, "log")
        self.debug = self.View(self, "debug")
        self.info = self.View(self, "info")
        self.error = self.View(self, "error")
        self.warning = self.View(self, "warning")

    def add_message(self, msg):
        # print the message to stdout: pytest will capute the output and
        # display the messages if the test fails.  {msg.type:7} is to
        # make sure that messages of all levels are aligned, i.e.:
        # [console.log    ] hello
        # [console.warning] world
        line = f"[console.{msg.type:7}] {msg.text}"
        if msg.type == "error":
            line = Color.set("red", line)
        elif msg.type == "warning":
            line = Color.set("brown", line)
        print(line)
        self._messages.append(msg)


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
        try:
            color = getattr(cls, color)
        except AttributeError:
            pass
        return f"\x1b[{color}m{string}\x1b[00m"
