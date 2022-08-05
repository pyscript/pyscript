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
