import re

import pytest

from .support import PyScriptTest


class TestOutuput(PyScriptTest):
    def test_simple_display(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello world')
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<div id="py-.*">hello world</div>'
        assert re.search(pattern, inner_html)

    def test_consecutive_display(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello 1')
            </py-script>
            <py-script>
                display('hello 2')
            </py-script>
        """
        )
        # need to improve this to get the first/second input
        # instead of just searching for it in the page
        inner_html = self.page.content()
        pattern = r'<div id="py-.*">hello 1</div>'
        assert re.search(pattern, inner_html)
        pattern = r'<div id="py-.*">hello 2</div>'
        assert re.search(pattern, inner_html)

    def test_no_implicit_target(self):
        self.pyscript_run(
            """
            <py-script>
                def display_hello():
                    # this fails because we don't have any implicit target
                    # from event handlers
                    display('hello')
            </py-script>
            <button id="my-button" py-onClick="display_hello()">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        text = self.page.text_content("body")
        assert "hello" not in text

        # currently the test infrastructure doesn't allow to easily assert that js exceptions were raised
        # this is a workaround but we need a better fix. Antonio promised to write it
        assert len(self._page_errors) == 1
        console_text = self._page_errors
        assert 'Implicit target not allowed here. Please use display(..., target=...)' in console_text[0].message
        self._page_errors = []

    def test_explicit_target_pyscript_tag(self):
        self.pyscript_run(
            """
            <py-script>
                def display_hello():
                    # this fails because we don't have any implicit target
                    # from event handlers
                    display('hello', target='second-pyscript-tag')
            </py-script>
            <py-script id="second-pyscript-tag">
                display_hello()
            </py-script>
        """
        )
        text = self.page.text_content("body")
        assert "hello" in text

    def test_explicit_target_on_button_tag(self):
        self.pyscript_run(
            """
            <py-script>
                def display_hello():
                    # this fails because we don't have any implicit target
                    # from event handlers
                    display('hello', target='my-button')
            </py-script>
            <button id="my-button" py-onClick="display_hello()">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        text = self.page.text_content("body")
        assert "hello" in text

    # def test_display_line_break(self):
    #     self.pyscript_run(
    #         r"""
    #         <py-script>
    #         display('hello\nworld')
    #         </py-script>
    #     """
    #     )
    #     inner_text = self.page.inner_text("html")
    #     # XXX fixme
    #     assert "1 1" == inner_text


##     def test_empty_HTML_and_console_output(self):
##         self.pyscript_run(
##             """
##             <py-script>
##                 print('1')
##                 console.log('2')
##                 console.error("3");
##             </py-script>
##         """
##         )
##         inner_html = self.page.content()
##         assert re.search('', inner_html)

##     def test_text_HTML_and_console_output(self):
##         self.pyscript_run(
##             """
##             <py-script>
##                 display('0')
##                 print('print from python')
##                 console.log('print from js')
##                 console.error('error from js');
##             </py-script>
##         """
##         )
##         inner_text = self.page.inner_text('html')
##         assert '0' == inner_text
##         console_text = self.console.all.lines
##         assert 'print from python' in console_text
##         assert 'print from js' in console_text
##         assert 'error from js' in console_text

##     def test_console_line_break(self):
##         self.pyscript_run(
##             """
##             <py-script>
##             print('1print\\n2print')
##             print('1console\\n2console')
##             </py-script>
##         """
##         )
##         console_text = self.console.all.lines
##         assert console_text.index('1print') == (console_text.index('2print') - 1)
##         assert console_text.index('1console') == (console_text.index('2console') - 1)

##     def test_display_multiple_python_types(self):
##         self.pyscript_run(
##             """
##             <py-script>
##                 l = ['A', 1, '!']
##                 d = {'B': 2, 'List': l}
##                 t = ('C', 3, '!')
##                 display(l, d, t)
##             </py-script>
##             """
##         )
##         inner_text = self.page.inner_text('html')
##         print(inner_text)
##         assert inner_text == "['A', 1, '!']\n{'B': 2, 'List': ['A', 1, '!']}\n('C', 3, '!')"


##     def test_button_display(self):
##         self.pyscript_run(
##             """
##                 <py-script id='py1'>
##                 def say_hello():
##                     display('hello')
##                 </py-script>
##                 <button id='py2' py-onclick="say_hello()">Click me</button>
##             """
##         )
##         self.page.locator("text=Click me").click()
##         inner_text = self.page.locator('id=py1-2').inner_text()
##         assert inner_text == 'hello'

##     @pytest.mark.xfail(reason=':p fixme later')
##     def test_multiple_async_display(self):
##         self.pyscript_run(
##             """
##                 <py-script id="py1">
##                 def say_hello():
##                     display('hello')
##                 </py-script>
##                 <py-script id="py2">
##                     say_hello()
##                 </py-script>
##             """
##         )
##         inner_html = self.page.content()
##         pattern = r'<div id="py2">hello</div>'
##         assert re.search(pattern, inner_html)

##     def test_multiple_async_multiple_display(self):
##         self.pyscript_run(
##             """
##                 <py-script id='pyA'>
##                     import asyncio
##                     for i in range(2):
##                         display('A')
##                         await asyncio.sleep(0.1)
##                 </py-script>

##                 <py-script id='pyB'>
##                     import asyncio
##                     for i in range(2):
##                         display('B')
##                         await asyncio.sleep(0.1)
##                 </py-script>
##             """
##         )
##         inner_text_A = self.page.locator('id=pyA').all_inner_texts()
##         inner_text_B = self.page.locator('id=pyB').all_inner_texts()
##         assert inner_text_A[0] == 'A\nA'
##         assert inner_text_B[0] == 'B\nB'

##     def test_image_display(self):
##         self.pyscript_run(
##             """
##                 <py-env>- matplotlib</py-env>
##                 <py-script>
##                     import matplotlib.pyplot as plt
##                     xpoints = [3, 6, 9]
##                     ypoints = [1, 2, 3]
##                     plt.plot(xpoints, ypoints)
##                     plt.show()
##                 </py-script>
##             """
##         )
##         inner_html = self.page.content()
##         pattern = r'<style id="matplotlib-figure-styles">'
##         assert re.search(pattern, inner_html)


## # TODO:

## #when i pass argument parent

## #test errors in the REPL

## # test if the err output was removed from repl after repl run successfully, after it ran and fail

## # test the following kinds of output
##     # "text/html": identity,
##     # "image/png": lambda value, meta: render_image("image/png", value, meta),
##     # "image/jpeg": lambda value, meta: render_image("image/jpeg", value, meta),
##     # "image/svg+xml": identity,
##     # "application/json": identity,
##     # "application/javascript": lambda value, meta: f"<script>{value}</script>",
