import base64
import io
import os
import re

import numpy as np
import pytest
from PIL import Image

from .support import PyScriptTest, wait_for_render

DISPLAY_OUTPUT_ID_PATTERN = r'[id^="py-"]'


def filter_inner_text(text, exclude=None):
    return "\n".join(filter_page_content(text.splitlines(), exclude=exclude))


def filter_page_content(lines, exclude=None):
    """Remove lines that are not relevant for the test. By default, ignores:
        ('', 'execution_thread = "main"', 'execution_thread = "worker"')

    Args:
        lines (list): list of strings
        exclude (list): list of strings to exclude

    Returns:
        list: list of strings
    """
    if exclude is None:
        exclude = {"", 'execution_thread = "main"', 'execution_thread = "worker"'}

    return [line for line in lines if line not in exclude]


class TestDisplay(PyScriptTest):
    @pytest.mark.skip(
        "DIFFERENT BEHAVIOUR!: display w/o target renders as TXT without <div> tag"
    )
    def test_simple_display(self):
        self.pyscript_run(
            """
            <py-script>
                print('ciao')
                from pyscript import display
                display("hello world")
            </py-script>
            """,
            timeout=20000,
        )
        node_list = self.page.query_selector_all(DISPLAY_OUTPUT_ID_PATTERN)
        pattern = r"<div>hello world</div>"
        assert node_list[0].inner_html() == pattern
        assert len(node_list) == 1

    def test_consecutive_display(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                display('hello 1')
            </py-script>
            <p>hello 2</p>
            <py-script>
                from pyscript import display
                display('hello 3')
            </py-script>
            """
        )
        inner_text = self.page.inner_text("body")
        lines = inner_text.splitlines()

        lines = [line for line in filter_page_content(lines)]  # remove empty lines
        assert lines == ["hello 1", "hello 2", "hello 3"]

    def test_target_attribute(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
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
                from pyscript import display
                display('hello 1')
            </py-script>
                <p>hello in between 1 and 2</p>
            <py-script id="second">
                from pyscript import display
                display('hello 2', target="second")
            </py-script>
            <py-script id="third">
                from pyscript import display
                display('hello 3')
            </py-script>
            """
        )
        inner_text = self.page.inner_text("body")
        lines = inner_text.splitlines()
        lines = [line for line in filter_page_content(lines)]  # remove empty lines
        assert lines == ["hello 1", "hello in between 1 and 2", "hello 2", "hello 3"]

    @pytest.mark.skip("DIFFERENT BEHAVIOUR!: display is not appending by default")
    def test_multiple_display_calls_same_tag(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                display('hello')
                display('world')
            </py-script>
        """
        )
        tag = self.page.locator("py-script")
        lines = tag.inner_text().splitlines()
        # TODO: Did the default change to append=False?
        assert lines == ["hello", "world"]

    def test_implicit_target_from_a_different_tag(self):
        self.pyscript_run(
            """
                <py-script id="py1">
                    from pyscript import display
                    def say_hello():
                        display('hello')
                </py-script>

                <py-script id="py2">
                    from pyscript import display
                    say_hello()
                </py-script>
            """
        )
        py1 = self.page.locator("#py1")
        py2 = self.page.locator("#py2")
        assert py1.inner_text() == ""
        assert py2.inner_text() == "hello"

    @pytest.mark.skip(
        "DIFFERENT BEHAVIOUR!: display is not raising Implicit target exception"
    )
    def test_no_implicit_target(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                def display_hello():
                    # this fails because we don't have any implicit target
                    # from event handlers
                    display('hello world')
            </py-script>
            <button id="my-button" py-click="display_hello()">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        self.check_py_errors("Implicit target not allowed here")
        ## error in console
        tb_lines = self.console.error.lines[-1].splitlines()

        # TODO: This does seem like a regression
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
                from pyscript import display
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

    @pytest.mark.skip(
        "FIXME: in Chrome fails with the error:"
        ' The interpreter "py" was not found. Available interpreters are: "py-script", "pyodide".'
    )
    def test_explicit_target_on_button_tag(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                def display_hello():
                    display('hello', target='my-button')
            </py-script>
            <button id="my-button" py-click="display_hello">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        text = self.page.locator("id=my-button").inner_text()
        # TODO: This does seem like a regression that
        assert "hello" in text

    def test_explicit_different_target_from_call(self):
        self.pyscript_run(
            """
            <py-script id="first-pyscript-tag">
                from pyscript import display
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
                from pyscript import display
                display('hello world', append=True)
            </py-script>
        """
        )
        node_list = self.page.query_selector_all(DISPLAY_OUTPUT_ID_PATTERN)
        pattern = r"<div>hello world</div>"

        assert node_list[0].inner_html() == pattern
        assert len(node_list) == 1

    def test_append_false(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                display('hello world', append=False)
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<py-script id="py-.*">hello world</py-script>'
        assert re.search(pattern, inner_html)

    @pytest.mark.skip("FIXME: display doesn't seem to have append=True as default")
    def test_display_multiple_values(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
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
                from pyscript import display
                display('hello', append=False)
                display('world', append=False)
            </py-script>
        """
        )
        inner_html = self.page.content()
        pattern = r'<py-script id="py-.*">world</py-script>'
        assert re.search(pattern, inner_html)

    @pytest.mark.skip("WEIRDLY BROKEN not because of Display?")
    def test_display_multiple_append_false_with_target(self):
        self.pyscript_run(
            """
            <div id="circle-div"></div>
            <py-script>
                from pyscript import display
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
            </script>
        """
        )
        innerhtml = self.page.locator("id=circle-div").inner_html()
        assert (
            innerhtml
            == '<svg height="20" width="20"><circle cx="10" cy="10" r="10" fill="red"></circle></svg>'  # noqa: E501
        )
        assert self.console.error.lines == []

    @pytest.mark.skip("FIXME: display doesn't seem to have append=True as default")
    def test_display_list_dict_tuple(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                l = ['A', 1, '!']
                d = {'B': 2, 'List': l}
                t = ('C', 3, '!')
                display(l, d, t)
            </py-script>
            """
        )
        inner_text = self.page.inner_text("html")
        filtered_inner_text = filter_inner_text(inner_text)
        print(filtered_inner_text)
        assert (
            filtered_inner_text
            == "['A', 1, '!']\n{'B': 2, 'List': ['A', 1, '!']}\n('C', 3, '!')"
        )

    @pytest.mark.skip(
        "DIFFERENT BEHAVIOUR!: display w/o target renders as TXT without <div> tag"
    )
    def test_display_should_escape(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                display("<p>hello world</p>")
            </py-script>
            """
        )
        # out = self.page.locator("py-script > div")
        node_list = self.page.query_selector_all(DISPLAY_OUTPUT_ID_PATTERN)
        node_list[0]
        # assert out.inner_html() == html.escape("<p>hello world</p>")
        # assert out.inner_text() == "<p>hello world</p>"

    @pytest.mark.skip("FIXME: HTML has been removed from pyscript")
    def test_display_HTML(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display, HTML
                display(HTML("<p>hello world</p>"))
            </py-script>
            """
        )
        # out = self.page.locator("py-script > div")
        node_list = self.page.query_selector_all(DISPLAY_OUTPUT_ID_PATTERN)
        node_list[0]
        # assert out.inner_html() == "<p>hello world</p>"
        # assert out.inner_text() == "hello world"

    @pytest.mark.skip(
        "BROKEN TEST: Text framework is causing config to fail with the following error:"
        """[  0.08 console.js_error ] SyntaxError: Unexpected token ']',
        "[ "s0",]" is not valid JSON
at parse (<anonymous>)
at t (https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js:2:98)
at Module.l (https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js:2:875)
at pt (https://fake_server/build/core.js:2:28737)


SUCCEEDS IN CHROME!
    """
    )
    def test_image_display(self):
        self.pyscript_run(
            """
                <py-config> packages = ["matplotlib"] </py-config>
                <py-script>
                    from pyscript import display
                    import matplotlib.pyplot as plt
                    xpoints = [3, 6, 9]
                    ypoints = [1, 2, 3]
                    plt.plot(xpoints, ypoints)
                    display(plt)
                </py-script>
            """
        )
        wait_for_render(self.page, "*", "<img src=['\"]data:image")
        test = self.page.wait_for_selector("img")
        img_src = test.get_attribute("src").replace(
            "data:image/png;charset=utf-8;base64,", ""
        )
        img_data = np.asarray(Image.open(io.BytesIO(base64.b64decode(img_src))))
        with Image.open(
            os.path.join(os.path.dirname(__file__), "test_assets", "line_plot.png"),
        ) as image:
            ref_data = np.asarray(image)

        deviation = np.mean(np.abs(img_data - ref_data))
        assert deviation == 0.0
        self.assert_no_banners()

    # @pytest.mark.skip("FIXME: display() without target is broken")
    def test_empty_HTML_and_console_output(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                import js
                print('print from python')
                js.console.log('print from js')
                js.console.error('error from js');
            </py-script>
        """
        )
        inner_html = self.page.content()
        assert re.search("", inner_html)
        console_text = self.console.all.lines
        assert "print from python" in console_text
        assert "print from js" in console_text
        assert "error from js" in console_text

    # @pytest.mark.skip("FIXME: display() without target is broken")
    def test_text_HTML_and_console_output(self):
        self.pyscript_run(
            """
            <py-script>
                from pyscript import display
                import js
                display('this goes to the DOM')
                print('print from python')
                js.console.log('print from js')
                js.console.error('error from js');
            </py-script>
        """
        )
        inner_text = self.page.inner_text("py-script")
        assert inner_text == "this goes to the DOM"
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

    #     @pytest.mark.skip(
    #         "FIX TEST: Works correctly in Chrome, but fails in TEST with the error:"
    #         """integration.support.PageErrors: JS errors found: 1
    # E           SyntaxError: Unexpected token ']', "[ "s0",]" is not valid JSON
    # E               at parse (<anonymous>)
    # E               at t (https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js:2:98)
    # E               at Module.l (https://cdn.jsdelivr.net/npm/basic-toml@0.3.1/es.js:2:875)
    # E               at pt (https://fake_server/build/core.js:2:28737)
    # """
    #     )
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
                from pyscript import display
                from PIL import Image
                img = Image.new("RGB", (4, 4), color=(0, 0, 0))
                display(img, target='img-target', append=False)
            </py-script>
            """
        )

        rendered_img_src = self.page.locator("img").get_attribute("src")
        assert rendered_img_src == expected_img_src
