import pytest
from playwright.sync_api import expect

from .support import PyScriptTest, with_execution_thread


@with_execution_thread(None)
class TestStyle(PyScriptTest):
    def test_pyscript_not_defined(self):
        """Test raw elements that are not defined for display:none"""
        doc = """
        <html>
          <head>
              <link rel="stylesheet" href="build/core.css" />
          </head>
          <body>
            <py-config>hello</py-config>
            <py-script>hello</script>
          </body>
        </html>
        """
        self.writefile("test-not-defined-css.html", doc)
        self.goto("test-not-defined-css.html")
        expect(self.page.locator("py-config")).to_be_hidden()
        expect(self.page.locator("py-script")).to_be_hidden()
