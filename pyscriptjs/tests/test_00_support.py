import pytest
from .support import PyScriptTest, Error



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
