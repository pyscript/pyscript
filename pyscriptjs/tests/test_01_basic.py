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
        self.writefile("hello.html", doc)
        self.goto("hello.html")
        wait_for_load(self.page)
        content = self.page.content()
        # XXX we should test the DOM
        assert "hello pyscript" in content
