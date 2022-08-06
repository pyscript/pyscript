import pytest

from .support import PyScriptTest


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
        # I wonder if we need to call wait_for_load in every single test?
        # It's only relevant to call it on tests that are interfering somehow with the way we load the page, IMO
        wait_for_load(self.page)
        content = self.page.content()
        assert "hello pyscript" in content
