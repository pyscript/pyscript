import os

import py
import pytest

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
        self.page = page
        self.tmpdir.chdir()

    def write(self, filename, content):
        f = self.tmpdir.join(filename)
        f.write(content)

    def goto(self, path):
        url = f"{self.http_server}/{path}"
        self.page.goto(url)


class TestBasic(PyScriptTest):
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
