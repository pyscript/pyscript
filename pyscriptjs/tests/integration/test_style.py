from playwright.sync_api import expect

from .support import PyScriptTest, skip_worker


class TestStyle(PyScriptTest):
    def test_pyscript_not_defined(self):
        """Test raw elements that are not defined for display:none"""
        doc = """
        <html>
          <head>
              <link rel="stylesheet" href="build/pyscript.css" />
          </head>
          <body>
            <py-config>hello</py-config>
            <py-script>hello</py-script>
            <py-repl>hello</py-repl>
          </body>
        </html>
        """
        self.writefile("test-not-defined-css.html", doc)
        self.goto("test-not-defined-css.html")
        expect(self.page.locator("py-config")).to_be_hidden()
        expect(self.page.locator("py-script")).to_be_hidden()
        expect(self.page.locator("py-repl")).to_be_hidden()

    @skip_worker("FIXME: display()")
    def test_pyscript_defined(self):
        """Test elements have visibility that should"""
        self.pyscript_run(
            """
            <py-config>
            name = "foo"
            </py-config>
            <py-script>display("hello")</py-script>
            <py-repl>display("hello")</py-repl>
            """
        )
        expect(self.page.locator("py-config")).to_be_hidden()
        expect(self.page.locator("py-script")).to_be_visible()
        expect(self.page.locator("py-repl")).to_be_visible()
