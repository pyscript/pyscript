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

    def test_execution_in_order(self):
        """
        Check that they py-script tags are executed in the same order they are
        defined
        """
        # NOTE: this test relies on the fact that pyscript does not write
        # anything to console.info. If we start writing to info in the future,
        # we will probably need to tweak this test.
        self.pyscript_run(
            """
            <py-script>import js; js.console.info('one')</py-script>
            <py-script>js.console.info('two')</py-script>
            <py-script>js.console.info('three')</py-script>
            <py-script>js.console.info('four')</py-script>
        """
        )
        assert self.console.info.lines == ["one", "two", "three", "four"]

    def test_escaping_of_angle_brackets(self):
        """
        Check that they py-script tags escape angle brackets
        """
        # NOTE: this test relies on the fact that pyscript does not write
        # anything to console.info. If we start writing to info in the future,
        # we will probably need to tweak this test.
        self.pyscript_run(
            """
            <py-script>import js; js.console.info(1<2, 1>2)</py-script>
            <py-script>js.console.info("<div></div>")</py-script>
        """
        )
        assert self.console.info.lines == ["true false", "<div></div>"]
