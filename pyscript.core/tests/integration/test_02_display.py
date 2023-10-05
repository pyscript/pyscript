################################################################################

import base64
import html
import io
import os
import re

import numpy as np
import pytest
from PIL import Image

from .support import (
    PageErrors,
    PyScriptTest,
    filter_inner_text,
    filter_page_content,
    only_main,
    skip_worker,
    wait_for_render,
)

DISPLAY_OUTPUT_ID_PATTERN = r'script-py[id^="py-"]'


class TestDisplay(PyScriptTest):
    def test_simple_display(self):
        self.pyscript_run(
            """
            <script type="py">
                print('ciao')
                from pyscript import display
                display("hello world")
            </script>
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
            <script type="py">
                from pyscript import display
                display('hello 1')
            </script>
            <p>hello 2</p>
            <script type="py">
                from pyscript import display
                display('hello 3')
            </script>
            """
        )
        inner_text = self.page.inner_text("body")
        lines = inner_text.splitlines()

        lines = [line for line in filter_page_content(lines)]  # remove empty lines
        assert lines == ["hello 1", "hello 2", "hello 3"]

    def test_target_parameter(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('hello world', target="mydiv")
            </script>
            <div id="mydiv"></div>
            """
        )
        mydiv = self.page.locator("#mydiv")
        assert mydiv.inner_text() == "hello world"

    def test_target_parameter_with_sharp(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('hello world', target="#mydiv")
            </script>
            <div id="mydiv"></div>
            """
        )
        mydiv = self.page.locator("#mydiv")
        assert mydiv.inner_text() == "hello world"

    def test_non_existing_id_target_raises_value_error(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('hello world', target="non-existing")
            </script>
            """
        )
        error_msg = (
            f"Invalid selector with id=non-existing. Cannot be found in the page."
        )
        self.check_py_errors(f"ValueError: {error_msg}")

    def test_empty_string_target_raises_value_error(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('hello world', target="")
            </script>
            """
        )
        self.check_py_errors(f"ValueError: Cannot have an empty target")

    def test_non_string_target_values_raise_typerror(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display("hello False", target=False)
            </script>
            """
        )
        error_msg = f"target must be str or None, not bool"
        self.check_py_errors(f"TypeError: {error_msg}")

        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display("hello False", target=123)
            </script>
            """
        )
        error_msg = f"target must be str or None, not int"
        self.check_py_errors(f"TypeError: {error_msg}")

    @skip_worker("NEXT: display(target=...) does not work")
    def test_tag_target_attribute(self):
        self.pyscript_run(
            """
            <script type="py" target="hello">
                from pyscript import display
                display('hello')
                display("goodbye world", target="goodbye")
                display('world')
            </script>
            <div id="hello"></div>
            <div id="goodbye"></div>
            """
        )
        hello = self.page.locator("#hello")
        assert hello.inner_text() == "hello\nworld"

        goodbye = self.page.locator("#goodbye")
        assert goodbye.inner_text() == "goodbye world"

    @skip_worker("NEXT: display target does not work properly")
    def test_target_script_py(self):
        self.pyscript_run(
            """
            <div>ONE</div>
            <script type="py" id="two">
                # just a placeholder
            </script>
            <div>THREE</div>

            <script type="py">
                from pyscript import display
                display('TWO', target="two")
            </script>
            """
        )
        text = self.page.inner_text("body")
        assert text == "ONE\nTWO\nTHREE"

    @skip_worker("NEXT: display target does not work properly")
    def test_consecutive_display_target(self):
        self.pyscript_run(
            """
            <script type="py" id="first">
                from pyscript import display
                display('hello 1')
            </script>
                <p>hello in between 1 and 2</p>
            <script type="py" id="second">
                from pyscript import display
                display('hello 2', target="second")
            </script>
            <script type="py" id="third">
                from pyscript import display
                display('hello 3')
            </script>
            """
        )
        inner_text = self.page.inner_text("body")
        lines = inner_text.splitlines()
        lines = [line for line in filter_page_content(lines)]  # remove empty lines
        assert lines == ["hello 1", "hello in between 1 and 2", "hello 2", "hello 3"]

    def test_multiple_display_calls_same_tag(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('hello')
                display('world')
            </script>
        """
        )
        tag = self.page.locator("script-py")
        lines = tag.inner_text().splitlines()
        assert lines == ["hello", "world"]

    @only_main  # with workers, two tags are two separate interpreters
    def test_implicit_target_from_a_different_tag(self):
        self.pyscript_run(
            """
                <script type="py">
                    from pyscript import display
                    def say_hello():
                        display('hello')
                </script>

                <script type="py">
                    from pyscript import display
                    say_hello()
                </script>
            """
        )
        elems = self.page.locator("script-py")
        py0 = elems.nth(0)
        py1 = elems.nth(1)
        assert py0.inner_text() == ""
        assert py1.inner_text() == "hello"

    @skip_worker("NEXT: py-click doesn't work")
    def test_no_explicit_target(self):
        self.pyscript_run(
            """
                <script type="py">
                    from pyscript import display
                    def display_hello(error):
                        display('hello world')
                </script>
                <button id="my-button" py-click="display_hello">Click me</button>
            """
        )
        self.page.locator("button").click()

        text = self.page.locator("script-py").text_content()
        assert "hello world" in text

    @skip_worker("NEXT: display target does not work properly")
    def test_explicit_target_pyscript_tag(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                def display_hello():
                    display('hello', target='second-pyscript-tag')
            </script>
            <script type="py" id="second-pyscript-tag">
                display_hello()
            </script>
            """
        )
        text = self.page.locator("script-py").nth(1).inner_text()
        assert text == "hello"

    @skip_worker("NEXT: display target does not work properly")
    def test_explicit_target_on_button_tag(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                def display_hello(error):
                    display('hello', target='my-button')
            </script>
            <button id="my-button" py-click="display_hello">Click me</button>
        """
        )
        self.page.locator("text=Click me").click()
        text = self.page.locator("id=my-button").inner_text()
        assert "hello" in text

    def test_append_true(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('AAA', append=True)
                display('BBB', append=True)
            </script>
        """
        )
        output = self.page.locator("script-py")
        assert output.inner_text() == "AAA\nBBB"

    def test_append_false(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('AAA', append=False)
                display('BBB', append=False)
            </script>
        """
        )
        output = self.page.locator("script-py")
        assert output.inner_text() == "BBB"

    def test_display_multiple_values(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                hello = 'hello'
                world = 'world'
                display(hello, world)
            </script>
            """
        )
        output = self.page.locator("script-py")
        assert output.inner_text() == "hello\nworld"

    def test_display_multiple_append_false(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display('hello', append=False)
                display('world', append=False)
            </script>
        """
        )
        output = self.page.locator("script-py")
        assert output.inner_text() == "world"

    # TODO: this is a display.py issue to fix when append=False is used
    #       do not use the first element, just clean up and then append
    #       remove the # display comment once that's done
    def test_display_multiple_append_false_with_target(self):
        self.pyscript_run(
            """
            <div id="circle-div"></div>
            <script type="py">
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
                # display(circle, target="circle-div", append=False)
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

    def test_display_list_dict_tuple(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                l = ['A', 1, '!']
                d = {'B': 2, 'List': l}
                t = ('C', 3, '!')
                display(l, d, t)
            </script>
            """
        )
        inner_text = self.page.inner_text("html")
        filtered_inner_text = filter_inner_text(inner_text)
        print(filtered_inner_text)
        assert (
            filtered_inner_text
            == "['A', 1, '!']\n{'B': 2, 'List': ['A', 1, '!']}\n('C', 3, '!')"
        )

    def test_display_should_escape(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                display("<p>hello world</p>")
            </script>
            """
        )
        out = self.page.locator("script-py > div")
        assert out.inner_html() == html.escape("<p>hello world</p>")
        assert out.inner_text() == "<p>hello world</p>"

    def test_display_HTML(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display, HTML
                display(HTML("<p>hello world</p>"))
            </script>
            """
        )
        out = self.page.locator("script-py > div")
        assert out.inner_html() == "<p>hello world</p>"
        assert out.inner_text() == "hello world"

    @skip_worker("NEXT: matplotlib-pyodide backend does not work")
    def test_image_display(self):
        self.pyscript_run(
            """
                <py-config> packages = ["matplotlib"] </py-config>
                <script type="py">
                    from pyscript import display
                    import matplotlib.pyplot as plt
                    xpoints = [3, 6, 9]
                    ypoints = [1, 2, 3]
                    plt.plot(xpoints, ypoints)
                    display(plt)
                </script>
            """,
            timeout=30 * 1000,
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

    def test_empty_HTML_and_console_output(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import display
                import js
                print('print from python')
                js.console.log('print from js')
                js.console.error('error from js');
            </script>
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
            <script type="py">
                from pyscript import display
                import js
                display('this goes to the DOM')
                print('print from python')
                js.console.log('print from js')
                js.console.error('error from js');
            </script>
        """
        )
        inner_text = self.page.inner_text("script-py")
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
            <script type="py">
            print('1print\\n2print')
            print('1console\\n2console')
            </script>
        """
        )
        console_text = self.console.all.lines
        assert console_text.index("1print") == (console_text.index("2print") - 1)
        assert console_text.index("1console") == (console_text.index("2console") - 1)

    @skip_worker("NEXT: display target does not work properly")
    def test_image_renders_correctly(self):
        """
        This is just a sanity check to make sure that images are rendered
        in a reasonable way.
        """
        self.pyscript_run(
            """
            <py-config>
                packages = ["pillow"]
            </py-config>

            <div id="img-target" />
            <script type="py">
                from pyscript import display
                from PIL import Image
                img = Image.new("RGB", (4, 4), color=(0, 0, 0))
                display(img, target='img-target', append=False)
            </script>
            """,
        )

        img_src = self.page.locator("img").get_attribute("src")
        assert img_src.startswith("data:image/png;charset=utf-8;base64")
