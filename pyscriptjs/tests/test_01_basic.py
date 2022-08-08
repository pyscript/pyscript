import re

from .support import PyScriptTest


class TestBasic(PyScriptTest):
    def test_pyscript_hello(self):
        self.pyscript_run(
            """
            <py-script>
                print('hello pyscript')
            </py-script>
        """
        )
        # this is a very ugly way of checking the content of the DOM. If we
        # find ourselves to write a lot of code in this style, we will
        # probably want to write a nicer API for it.
        inner_html = self.page.locator("py-script").inner_html()
        pattern = r'<div id="py-.*">hello pyscript</div>'
        assert re.search(pattern, inner_html)
