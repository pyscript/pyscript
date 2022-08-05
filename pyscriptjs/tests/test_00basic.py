import os
import py
import pytest
from playwright.sync_api import Error

ROOT = py.path.local(__file__).dirpath("..", "..")
BUILD = ROOT.join("pyscriptjs", "build")


@pytest.mark.usefixtures("init")
class PyScriptTest:
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
        self.console_log = []
        self.console_text = []
        self._page_errors = []
        page.on("console", self._on_console)
        page.on("pageerror", self._on_pageerror)

    def _on_console(self, msg):
        self.console_log.append(msg)
        self.console_text.append(msg.text)

    def _on_pageerror(self, error):
        self._page_errors.append(error)

    def check_errors(self):
        assert len(self._page_errors) == 1
        exc = self._page_errors.pop()
        raise exc

    def write(self, filename, content):
        f = self.tmpdir.join(filename)
        f.write(content)

    def goto(self, path):
        url = f"{self.http_server}/{path}"
        self.page.goto(url)


# XXX: we should move this to its own file
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

    def test_console_log(self):
        """
        Test that we capture console.log messages correctly.
        """
        doc = """
        <html>
          <body>
            <script>console.log("hello world");</script>
          </body>
        </html>
        """
        self.write("basic.html", doc)
        self.goto("basic.html")
        assert len(self.console_log) == 1
        msg = self.console_log[0]
        assert msg.type == 'log'
        assert msg.text == 'hello world'
        assert self.console_text == ['hello world']

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


class TestBasic(PyScriptTest):

    def test_pyscript_hello(self):
        # XXX we need a better way to implement wait_for_load
        from .test_examples import wait_for_load

        doc = f"""
        <html>
          <head>
              <link rel="stylesheet" href="{self.http_server}/build/pyscript.css" />
              <script defer src="{self.http_server}/build/pyscript.js"></script>
          </head>
          <body>
            <py-script>
                print('<b>hello pyscript</b>')
            </py-script>
          </body>
        </html>
        """
        self.write("hello.html", doc)
        self.goto("hello.html")
        wait_for_load(self.page)
        content = self.page.content()
        # XXX write a test with the DOM
