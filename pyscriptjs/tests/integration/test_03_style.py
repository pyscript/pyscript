import re

from playwright.sync_api import expect

from .support import PyScriptTest


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
            <py-title>hello</py-title>
            <py-inputbox>hello</py-inputbox>
            <py-button>hello</py-button>
            <py-box>hello</py-box>
          </body>
        </html>
        """
        self.writefile("test-not-defined-css.html", doc)
        self.goto("test-not-defined-css.html")
        expect(self.page.locator("py-config")).to_be_hidden()
        expect(self.page.locator("py-script")).to_be_hidden()
        expect(self.page.locator("py-repl")).to_be_hidden()
        expect(self.page.locator("py-title")).to_be_hidden()
        expect(self.page.locator("py-inputbox")).to_be_hidden()
        expect(self.page.locator("py-button")).to_be_hidden()
        expect(self.page.locator("py-box")).to_be_hidden()

    def test_pyscript_defined(self):
        """Test elements have visibility that should"""
        self.pyscript_run(
            """
            <py-config>
            name = "foo"
            </py-config>
            <py-script>print("hello")</py-script>
            <py-repl>print("hello")</py-repl>
            <py-title>hello</py-title>
            <py-inputbox label="my input">
                import js
                def on_keypress(evt):
                    if evt.key == "Enter":
                        js.console.log(evt.target.value)
            </py-inputbox>
            <py-box>
                <py-button label="my button">
                import js
                def on_click(evt):
                    js.console.log('clicked!')
                </py-button>
            </py-box>
            """
        )
        expect(self.page.locator("py-config")).to_be_hidden()
        expect(self.page.locator("py-script")).to_be_visible()
        expect(self.page.locator("py-repl")).to_be_visible()
        expect(self.page.locator("py-title")).to_be_visible()
        expect(self.page.locator("py-inputbox")).to_be_visible()
        expect(self.page.locator("py-button")).to_be_visible()
        expect(self.page.locator("py-box")).to_be_visible()
