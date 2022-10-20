import re

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
        first_pattern = r'<div id="py-.*?-2">hello 1</div>'
        assert re.search(first_pattern, inner_html)
        second_pattern = r'<div id="py-.*?-3">hello 2</div>'
        assert re.search(second_pattern, inner_html)

        assert first_pattern is not second_pattern

    def test_multiple_display_calls_same_tag(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello')
                display('world')
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<div id="py-.*?-2">hello</div>'
        assert re.search(pattern, inner_html)
        pattern = r'<div id="py-.*?-3">world</div>'
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
        self.check_js_errors(
            "Implicit target not allowed here. Please use display(..., target=...)"
        )

    def test_explicit_target_pyscript_tag(self):
        self.pyscript_run(
            """
            <py-script>
                def display_hello():
                    display('hello', target='second-pyscript-tag')
            </py-script>
            <py-script id="second-pyscript-tag">
                display_hello()
            </py-script>
        """
        )
        text = self.page.locator("id=second-pyscript-tag-2").inner_text()
        assert "hello" in text

    def test_explicit_target_on_button_tag(self):
        self.pyscript_run(
            """
            <py-script>
                def display_hello():
                    display('hello', target='my-button')
            </py-script>
            <button id="my-button" py-onClick="display_hello()">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        text = self.page.locator("id=my-button").inner_text()
        assert "hello" in text

    def test_explicit_different_target_from_call(self):
        self.pyscript_run(
            """
            <py-script id="first-pyscript-tag">
                def display_hello():
                    display('hello', target='second-pyscript-tag')
            </py-script>
            <py-script id="second-pyscript-tag">
                print('nothing to see here')
            </py-script>
            <py-script>
                display_hello()
            </py-script>
        """
        )
        text = self.page.locator("id=second-pyscript-tag").all_inner_texts()
        assert "hello" in text

    def test_append_true(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello world', append=True)
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<div id="py-.*">hello world</div>'
        assert re.search(pattern, inner_html)

    def test_append_false(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello world', append=False)
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<py-script id="py-.*">hello world</py-script>'
        assert re.search(pattern, inner_html)

    def test_display_multiple_values(self):
        self.pyscript_run(
            """
            <py-script>
                hello = 'hello'
                world = 'world'
                display(hello, world)
            </py-script>
            """
        )
        inner_text = self.page.inner_text("html")
        assert inner_text == "hello\nworld"

    def test_display_list_dict_tuple(self):
        self.pyscript_run(
            """
            <py-script>
                l = ['A', 1, '!']
                d = {'B': 2, 'List': l}
                t = ('C', 3, '!')
                display(l, d, t)
            </py-script>
            """
        )
        inner_text = self.page.inner_text("html")
        print(inner_text)
        assert (
            inner_text
            == "['A', 1, '!']\n{'B': 2, 'List': ['A', 1, '!']}\n('C', 3, '!')"
        )

    def test_image_display(self):
        self.pyscript_run(
            """
                <py-config> packages = [  "matplotlib"] </py-config>
                <py-script>
                    import matplotlib.pyplot as plt
                    xpoints = [3, 6, 9]
                    ypoints = [1, 2, 3]
                    plt.plot(xpoints, ypoints)
                    plt.show()
                </py-script>
            """
        )
        inner_html = self.page.content()
        pattern = r'<style id="matplotlib-figure-styles">'
        assert re.search(pattern, inner_html)

    def test_empty_HTML_and_console_output(self):
        self.pyscript_run(
            """
            <py-script>
                print('print from python')
                console.log('print from js')
                console.error('error from js');
            </py-script>
        """
        )
        inner_html = self.page.content()
        assert re.search("", inner_html)
        console_text = self.console.all.lines
        assert "print from python" in console_text
        assert "print from js" in console_text
        assert "error from js" in console_text

    def test_text_HTML_and_console_output(self):
        self.pyscript_run(
            """
            <py-script>
                display('0')
                print('print from python')
                console.log('print from js')
                console.error('error from js');
            </py-script>
        """
        )
        inner_text = self.page.inner_text("html")
        assert "0" == inner_text
        console_text = self.console.all.lines
        assert "print from python" in console_text
        assert "print from js" in console_text
        assert "error from js" in console_text

    def test_console_line_break(self):
        self.pyscript_run(
            """
            <py-script>
            print('1print\\n2print')
            print('1console\\n2console')
            </py-script>
        """
        )
        console_text = self.console.all.lines
        assert console_text.index("1print") == (console_text.index("2print") - 1)
        assert console_text.index("1console") == (console_text.index("2console") - 1)
