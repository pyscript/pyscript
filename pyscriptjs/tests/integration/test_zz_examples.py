import base64
import io
import math
import os
import re
import time

import numpy as np
import pytest
from PIL import Image

from .support import ROOT, PyScriptTest

MAX_TEST_TIME = 30  # Number of seconds allowed for checking a testing condition
TEST_TIME_INCREMENT = 0.25  # 1/4 second, the length of each iteration
TEST_ITERATIONS = math.ceil(
    MAX_TEST_TIME / TEST_TIME_INCREMENT
)  # 120 iters of 1/4 second


def wait_for_render(page, selector, pattern):
    """
    Assert that rendering inserts data into the page as expected: search the
    DOM from within the timing loop for a string that is not present in the
    initial markup but should appear by way of rendering
    """
    re_sub_content = re.compile(pattern)
    py_rendered = False  # Flag to be set to True when condition met

    for _ in range(TEST_ITERATIONS):
        content = page.inner_html(selector)
        if re_sub_content.search(content):
            py_rendered = True
            break
        time.sleep(TEST_TIME_INCREMENT)

    assert py_rendered  # nosec


@pytest.mark.usefixtures("chdir")
class TestExamples(PyScriptTest):
    """
    Each example requires the same three tests:

        - Test that the initial markup loads properly (currently done by
          testing the <title> tag's content)
        - Testing that pyscript is loading properly
        - Testing that the page contains appropriate content after rendering
    """

    @pytest.fixture()
    def chdir(self):
        # make sure that the http server serves from the right directory
        ROOT.join("pyscriptjs").chdir()

    def test_hello_world(self):
        self.goto("examples/hello_world.html")
        self.wait_for_pyscript()
        assert self.page.title() == "PyScript Hello World"
        content = self.page.content()
        pattern = "\\d+/\\d+/\\d+, \\d+:\\d+:\\d+"  # e.g. 08/09/2022 15:57:32
        assert re.search(pattern, content)

    def test_simple_clock(self):
        self.goto("examples/simple_clock.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Simple Clock Demo"
        pattern = r"\d{2}/\d{2}/\d{4}, \d{2}:\d{2}:\d{2}"
        # run for 5 seconds to be sure that we see the page with "It's
        # espresso time!"
        for _ in range(5):
            content = self.page.inner_html("#outputDiv2")
            if re.match(pattern, content) and int(content[-1]) in (0, 4, 8):
                assert self.page.inner_html("#outputDiv3") == "It's espresso time!"
                break
            else:
                time.sleep(1)
        else:
            assert False, "Espresso time not found :("

    def test_altair(self):
        self.goto("examples/altair.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Altair"
        wait_for_render(self.page, "*", '<canvas.*?class=\\"marks\\".*?>')
        save_as_png_link = self.page.locator("text=Save as PNG")
        see_source_link = self.page.locator("text=View Source")
        # These shouldn't be visible since we didn't click the menu
        assert not save_as_png_link.is_visible()
        assert not see_source_link.is_visible()

        self.page.locator("summary").click()

        # Let's confirm that the links are visible now after clicking the menu
        assert save_as_png_link.is_visible()
        assert see_source_link.is_visible()

    def test_bokeh(self):
        # XXX improve this test
        self.goto("examples/bokeh.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Bokeh Example"
        wait_for_render(self.page, "*", '<div.*class=\\"bk\\".*>')

    def test_bokeh_interactive(self):
        # XXX improve this test
        self.goto("examples/bokeh_interactive.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Bokeh Example"
        wait_for_render(self.page, "*", '<div.*?class=\\"bk\\".*?>')

    def test_d3(self):
        self.goto("examples/d3.html")
        self.wait_for_pyscript()
        assert (
            self.page.title() == "d3: JavaScript & PyScript visualizations side-by-side"
        )
        wait_for_render(self.page, "*", "<svg.*?>")
        assert "PyScript version" in self.page.content()
        pyscript_chart = self.page.wait_for_selector("#py")

        # Let's simply assert that the text of the chart is as expected which
        # means that the chart rendered successfully and with the right text
        assert "🍊21\n🍇13\n🍏8\n🍌5\n🍐3\n🍋2\n🍎1\n🍉1" in pyscript_chart.inner_text()

    def test_folium(self):
        self.goto("examples/folium.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Folium"
        wait_for_render(self.page, "*", "<iframe srcdoc=")

        # We need to look into the iframe first
        iframe = self.page.frame_locator("iframe")

        # Just checking that legend was rendered correctly
        legend = iframe.locator("#legend")
        assert "Unemployment Rate (%)" in legend.inner_html()

        # Let's check that the zoom buttons are rendered and clickable
        # Note: if element is not clickable it will timeout
        zoom_in = iframe.locator("[aria-label='Zoom in']")
        assert "+" in zoom_in.inner_text()
        zoom_in.click()
        zoom_out = iframe.locator("[aria-label='Zoom out']")
        assert "−" in zoom_out.inner_text()
        zoom_out.click()

    def test_matplotlib(self):
        self.goto("examples/matplotlib.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Matplotlib"
        wait_for_render(self.page, "*", "<img src=['\"]data:image")
        # The image is being rended using base64, lets fetch its source
        # and replace everything but the actual base64 string.\
        img_src = (
            self.page.wait_for_selector("img")
            .get_attribute("src")
            .replace("data:image/png;charset=utf-8;base64,", "")
        )
        # Finally, let's  get the np array from the previous data
        img_data = np.asarray(Image.open(io.BytesIO(base64.b64decode(img_src))))
        with Image.open(
            os.path.join(os.path.dirname(__file__), "test_assets", "tripcolor.png"),
        ) as image:
            ref_data = np.asarray(image)
        # Now that we have both images data as a numpy array
        # let's confirm that they are the same
        deviation = np.mean(np.abs(img_data - ref_data))
        assert deviation == 0.0

    def test_numpy_canvas_fractals(self):
        self.goto("examples/numpy_canvas_fractals.html")
        self.wait_for_pyscript()
        assert (
            self.page.title()
            == "Visualization of Mandelbrot, Julia and Newton sets with NumPy and HTML5 canvas"
        )
        wait_for_render(
            self.page, "*", "<div.*?id=['\"](mandelbrot|julia|newton)['\"].*?>"
        )

        # Assert that we get the title and canvas for each element
        mandelbrot = self.page.wait_for_selector("#mandelbrot")
        assert "Mandelbrot set" in mandelbrot.inner_text()
        assert "<canvas" in mandelbrot.inner_html()

        julia = self.page.wait_for_selector("#julia")
        assert "Julia set" in julia.inner_text()
        assert "<canvas" in julia.inner_html()

        newton = self.page.wait_for_selector("#newton")
        assert "Newton set" in newton.inner_text()
        assert "<canvas" in newton.inner_html()

        # Confirm that all fieldsets are rendered correctly
        poly = newton.wait_for_selector("#poly")
        assert poly.input_value() == "z**3 - 2*z + 2"

        coef = newton.wait_for_selector("#coef")
        assert coef.input_value() == "1"

        # Let's now change some x/y values to confirm that they
        # are editable (is it the best way to test this?)
        x0 = newton.wait_for_selector("#x0")
        y0 = newton.wait_for_selector("#y0")

        x0.fill("50")
        assert x0.input_value() == "50"
        y0.fill("-25")
        assert y0.input_value() == "-25"

        # This was the first computation with the default values
        assert self.console.log.lines[-2] == "Computing Newton set ..."
        # Confirm that changing the input values, triggered a new computation
        assert self.console.log.lines[-1] == "Computing Newton set ..."

    def test_panel(self):
        self.goto("examples/panel.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Panel Example"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")
        slider_title = self.page.wait_for_selector(".bk-slider-title")
        assert slider_title.inner_text() == "Amplitude: 0"

        slider_result = self.page.wait_for_selector(".bk-clearfix")
        assert slider_result.inner_text() == "Amplitude is: 0"

        amplitude_bar = self.page.wait_for_selector(".noUi-connects")
        amplitude_bar.click()

        # Let's confirm that slider title changed
        assert slider_title.inner_text() == "Amplitude: 5"

    def test_panel_deckgl(self):
        # XXX improve this test
        self.goto("examples/panel_deckgl.html")
        self.wait_for_pyscript()
        assert self.page.title() == "PyScript/Panel DeckGL Demo"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    def test_panel_kmeans(self):
        # XXX improve this test
        self.goto("examples/panel_kmeans.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Pyscript/Panel KMeans Demo"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    def test_panel_stream(self):
        # XXX improve this test
        self.goto("examples/panel_stream.html")
        self.wait_for_pyscript()
        assert self.page.title() == "PyScript/Panel Streaming Demo"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    def test_repl(self):
        self.goto("examples/repl.html")
        self.wait_for_pyscript()
        assert self.page.title() == "REPL"
        wait_for_render(self.page, "*", "<py-repl.*?>")

        self.page.locator("py-repl").type("print('Hello, World!')")
        self.page.locator("button").click()

        assert self.page.locator("#my-repl-1").text_content() == "Hello, World!"

        # Confirm that using the second repl still works properly
        self.page.locator("#my-repl-2").type("2*2")
        self.page.keyboard.press("Shift+Enter")
        # Make sure that the child of the second repl is attached properly
        # before looking into the text_content
        second_repl_result = self.page.wait_for_selector(
            "#my-repl-2-2", state="attached"
        )
        assert second_repl_result.text_content() == "4"

    def test_repl2(self):
        self.goto("examples/repl2.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Custom REPL Example"
        wait_for_render(self.page, "*", "<py-repl.*?>")
        # confirm we can import utils and run one command
        self.page.locator("py-repl").type("import utils\nutils.now()")
        self.page.locator("button").click()
        # Make sure the output is in the page
        self.page.wait_for_selector("#output")
        # utils.now returns current date time
        content = self.page.content()
        pattern = "\\d+/\\d+/\\d+, \\d+:\\d+:\\d+"  # e.g. 08/09/2022 15:57:32
        assert re.search(pattern, content)

    def test_todo(self):
        self.goto("examples/todo.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Todo App"
        wait_for_render(self.page, "*", "<input.*?id=['\"]new-task-content['\"].*?>")
        todo_input = self.page.locator("input")
        submit_task_button = self.page.locator("button")

        todo_input.type("Fold laundry")
        submit_task_button.click()

        first_task = self.page.locator("#task-0")
        assert "Fold laundry" in first_task.inner_text()

        task_checkbox = first_task.locator("input")
        # Confirm that the new task isn't checked
        assert not task_checkbox.is_checked()

        # Let's mark it as done now
        task_checkbox.check()

        # Basic check that the task has the line-through class
        assert (
            '<p class="m-0 inline line-through">Fold laundry</p>'
            in first_task.inner_html()
        )

    def test_todo_pylist(self):
        # XXX improve this test
        self.goto("examples/todo-pylist.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Todo App"
        wait_for_render(self.page, "*", "<input.*?id=['\"]new-task-content['\"].*?>")

    @pytest.mark.xfail(reason="To be moved to collective and updated, see issue #686")
    def test_toga_freedom(self):
        self.goto("examples/toga/freedom.html")
        self.wait_for_pyscript()
        assert self.page.title() in ["Loading...", "Freedom Units"]
        wait_for_render(self.page, "*", "<(main|div).*?id=['\"]toga_\\d+['\"].*?>")

        page_content = self.page.content()

        assert "Fahrenheit" in page_content
        assert "Celsius" in page_content

        self.page.locator("#toga_f_input").fill("105")
        self.page.locator("button#toga_calculate").click()
        result = self.page.locator("#toga_c_input")
        assert "40.555" in result.input_value()

    def test_webgl_raycaster_index(self):
        # XXX improve this test
        self.goto("examples/webgl/raycaster/index.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Raycaster"
        wait_for_render(self.page, "*", "<canvas.*?>")
