import base64
import html
import io
import re

from PIL import Image

from .support import PyScriptTest


class TestOutput(PyScriptTest):
    def test_simple_display(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello world')
            </py-script>
        """
        )
        node_list = self.page.query_selector_all(r'[id^="py-internal"]')
        pattern = r"<div>hello world</div>"
        assert re.search(pattern, node_list[0].inner_html())
        assert len(node_list) == 1

    def test_consecutive_display(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello 1')
            </py-script>
            <p>hello 2</p>
            <py-script>
                display('hello 3')
            </py-script>
            """
        )
        inner_text = self.page.inner_text("body")
        lines = inner_text.splitlines()
        lines = [line for line in lines if line != ""]  # remove empty lines
        assert lines == ["hello 1", "hello 2", "hello 3"]

    def test_target_attribute(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello world', target="mydiv")
            </py-script>
            <div id="mydiv"></div>
            """
        )
        mydiv = self.page.locator("#mydiv")
        assert mydiv.inner_text() == "hello world"

    def test_consecutive_display_target(self):
        self.pyscript_run(
            """
            <py-script id="first">
                display('hello 1')
            </py-script>
                <p>hello in between 1 and 2</p>
            <py-script id="second">
                display('hello 2', target="second")
            </py-script>
            <py-script id="third">
                display('hello 3')
            </py-script>
            """
        )
        inner_text = self.page.inner_text("body")
        lines = inner_text.splitlines()
        lines = [line for line in lines if line != ""]  # remove empty lines
        assert lines == ["hello 1", "hello in between 1 and 2", "hello 2", "hello 3"]

    def test_multiple_display_calls_same_tag(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello')
                display('world')
            </py-script>
        """
        )
        tag = self.page.locator("py-script")
        lines = tag.inner_text().splitlines()
        assert lines == ["hello", "world"]

    def test_implicit_target_from_a_different_tag(self):
        self.pyscript_run(
            """
                <py-script id="py1">
                    def say_hello():
                        display('hello')
                </py-script>

                <py-script id="py2">
                    say_hello()
                </py-script>
            """
        )
        py1 = self.page.locator("#py1")
        py2 = self.page.locator("#py2")
        assert py1.inner_text() == ""
        assert py2.inner_text() == "hello"

    def test_no_implicit_target(self):
        self.pyscript_run(
            """
            <py-script>
                def display_hello():
                    # this fails because we don't have any implicit target
                    # from event handlers
                    display('hello world')
            </py-script>
            <button id="my-button" py-onClick="display_hello()">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        ## error in console
        tb_lines = self.console.error.lines[-1].splitlines()
        assert tb_lines[0] == "[pyexec] Python exception:"
        assert tb_lines[1] == "Traceback (most recent call last):"
        assert (
            tb_lines[-1]
            == "Exception: Implicit target not allowed here. Please use display(..., target=...)"
        )

        text = self.page.text_content("body")
        assert "hello world" not in text

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
        text = self.page.locator("id=second-pyscript-tag").inner_text()
        assert text == "hello"

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
        node_list = self.page.query_selector_all(r'[id^="py-internal"]')
        pattern = r"<div>hello world</div>"
        assert re.search(pattern, node_list[0].inner_html())
        assert len(node_list) == 1

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

    def test_display_multiple_append_false(self):
        self.pyscript_run(
            """
            <py-script>
                display('hello', append=False)
                display('world', append=False)
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<py-script id="py-.*">world</py-script>'
        assert re.search(pattern, inner_html)

    def test_display_multiple_append_false_with_target(self):
        self.pyscript_run(
            """
            <div id="circle-div"></div>
            <py-script>
                class Circle:
                    r = 0
                    def _repr_svg_(self):
                        return (
                            f'<svg height="{self.r*2}" width="{self.r*2}">'
                            f'<circle cx="{self.r}" cy="{self.r}" r="{self.r}" fill="red" /></svg>'
                        )

                circle = Circle()

                circle.r += 5
                display(circle, target="circle-div", append=False)
                circle.r += 5
                display(circle, target="circle-div", append=False)
            </py-script>
        """
        )
        innerhtml = self.page.locator("id=circle-div").inner_html()
        assert (
            innerhtml
            == '<svg height="20" width="20"><circle cx="10" cy="10" r="10" fill="red"></circle></svg>'  # noqa: E501
        )

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

    def test_display_should_escape(self):
        self.pyscript_run(
            """
            <py-script>
                display("<p>hello world</p>")
            </py-script>
            """
        )
        out = self.page.locator("py-script > div")
        assert out.inner_html() == html.escape("<p>hello world</p>")
        assert out.inner_text() == "<p>hello world</p>"

    def test_display_HTML(self):
        self.pyscript_run(
            """
            <py-script>
                display(HTML("<p>hello world</p>"))
            </py-script>
            """
        )
        out = self.page.locator("py-script > div")
        assert out.inner_html() == "<p>hello world</p>"
        assert out.inner_text() == "hello world"

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
                display('this goes to the DOM')
                print('print from python')
                console.log('print from js')
                console.error('error from js');
            </py-script>
        """
        )
        inner_text = self.page.inner_text("py-script")
        assert inner_text == "this goes to the DOM"
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-2:] == [
            "print from python",
            "print from js",
        ]
        print(self.console.error.lines)
        assert self.console.error.lines[-1] == "error from js"

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

    def test_image_renders_correctly(self):
        """This is just a sanity check to make sure that images are rendered correctly."""
        buffer = io.BytesIO()
        img = Image.new("RGB", (4, 4), color=(0, 0, 0))
        img.save(buffer, format="PNG")

        b64_img = base64.b64encode(buffer.getvalue()).decode("utf-8")
        expected_img_src = f"data:image/png;charset=utf-8;base64,{b64_img}"

        self.pyscript_run(
            """
            <py-config>
                packages = ["pillow"]
            </py-config>

            <div id="img-target" />
            <py-script>
                from PIL import Image
                img = Image.new("RGB", (4, 4), color=(0, 0, 0))
                display(img, target='img-target', append=False)
            </py-script>
            """
        )

        rendered_img_src = self.page.locator("img").get_attribute("src")
        assert rendered_img_src == expected_img_src
