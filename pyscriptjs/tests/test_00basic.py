import pytest
import os

@pytest.mark.usefixtures('init')
class PyScriptTest:

    @pytest.fixture()
    def init(self, tmpdir, http_server, page):
        self.tmpdir = tmpdir
        self.http_server = http_server
        self.page = page
        self.tmpdir.chdir()

    def write(self, filename, content):
        f = self.tmpdir.join(filename)
        f.write(content)

    def goto(self, path):
        url = f'{self.http_server}/{path}'
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
        assert '<h1>Hello world</h1>' in content
