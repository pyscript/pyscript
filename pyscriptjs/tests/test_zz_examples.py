"""Each example requires the same three tests:

- Test that the initial markup loads properly (currently done by testing the <title>
  tag's content)
- Testing that pyodide is loading properly
- Testing that the page contains appropriate content after rendering

The single function iterates through the examples, instantiates one playwright browser
session per example, and runs all three of each example's tests in that same browser
session.
 """

import math
import re
import time

import pytest

from .support import ROOT, PyScriptTest

MAX_TEST_TIME = 30  # Number of seconds allowed for checking a testing condition
TEST_TIME_INCREMENT = 0.25  # 1/4 second, the length of each iteration
TEST_ITERATIONS = math.ceil(
    MAX_TEST_TIME / TEST_TIME_INCREMENT
)  # 120 iters of 1/4 second

# Content that is displayed in the page while pyodide loads
LOADING_MESSAGES = [
    "Loading runtime...",
    "Runtime created...",
    "Initializing components...",
    "Initializing scripts...",
]


def wait_for_load(page):
    """
    Assert that pyscript loading messages appear.
    """
    pyodide_loading = False  # Flag to be set to True when condition met

    for _ in range(TEST_ITERATIONS):
        content = page.text_content("*")
        for message in LOADING_MESSAGES:
            if message in content:
                pyodide_loading = True
        if pyodide_loading:
            break
        time.sleep(TEST_TIME_INCREMENT)

    assert pyodide_loading  # nosec


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
        # XXX improve this test
        self.goto("examples/altair.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Altair"
        wait_for_render(self.page, "*", '<canvas.*?class=\\"marks\\".*?>')

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
        # XXX improve this test
        self.goto("examples/d3.html")
        self.wait_for_pyscript()
        assert (
            self.page.title() == "d3: JavaScript & PyScript visualizations side-by-side"
        )
        wait_for_render(self.page, "*", "<svg.*?>")

    def test_folium(self):
        # XXX improve this test
        self.goto("examples/folium.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Folium"
        wait_for_render(self.page, "*", "<iframe srcdoc=")

    def test_matplotlib(self):
        # XXX improve this test
        self.goto("examples/matplotlib.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Matplotlib"
        wait_for_render(self.page, "*", "<img src=['\"]data:image")

    def test_numpy_canvas_fractals(self):
        # XXX improve this test
        self.goto("examples/numpy_canvas_fractals.html")
        self.wait_for_pyscript()
        assert (
            self.page.title()
            == "Visualization of Mandelbrot, Julia and Newton sets with NumPy and HTML5 canvas"
        )
        wait_for_render(
            self.page, "*", "<div.*?id=['\"](mandelbrot|julia|newton)['\"].*?>"
        )

    def test_panel(self):
        # XXX improve this test
        self.goto("examples/panel.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Panel Example"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    def test_panel_deckgl(self):
        # XXX improve this test
        self.goto("examples/panel_deckgl.html")
        self.wait_for_pyscript()
        assert self.page.title() == "PyScript/Panel DeckGL Demo"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    def test_panel_kmeans(self):
        # XXX improve this test
        self.goto("examples/panel_kmeans.html")
        self.wait_for_pyscript(timeout=120 * 1000)
        assert self.page.title() == "Pyscript/Panel KMeans Demo"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    @pytest.mark.xfail(
        reason="JsError: TypeError: Cannot read properties of undefined (reading 'setAttribute')"
    )
    def test_panel_stream(self):
        # XXX improve this test
        self.goto("examples/panel_stream.html")
        self.wait_for_pyscript()
        assert self.page.title() == "PyScript/Panel Streaming Demo"
        wait_for_render(self.page, "*", "<div.*?class=['\"]bk-root['\"].*?>")

    def test_repl(self):
        # XXX improve this test
        self.goto("examples/repl.html")
        self.wait_for_pyscript()
        assert self.page.title() == "REPL"
        wait_for_render(self.page, "*", "<py-repl.*?>")

    def test_repl2(self):
        # XXX improve this test
        self.goto("examples/repl2.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Custom REPL Example"
        wait_for_render(self.page, "*", "<py-repl.*?>")

    def test_todo(self):
        # XXX improve this test
        self.goto("examples/todo.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Todo App"
        wait_for_render(self.page, "*", "<input.*?id=['\"]new-task-content['\"].*?>")

    @pytest.mark.xfail(reason="JsError, issue #673")
    def test_todo_pylist(self):
        # XXX improve this test
        self.goto("examples/todo-pylist.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Todo App"
        wait_for_render(self.page, "*", "<input.*?id=['\"]new-task-content['\"].*?>")

    def test_toga_freedom(self):
        # XXX improve this test
        self.goto("examples/toga/freedom.html")
        self.wait_for_pyscript()
        assert self.page.title() in ["Loading...", "Freedom Units"]
        wait_for_render(self.page, "*", "<(main|div).*?id=['\"]toga_\\d+['\"].*?>")

    @pytest.mark.xfail(reason="it never finishes loading")
    def test_webgl_raycaster_index(self):
        # XXX improve this test
        self.goto("examples/webgl/raycaster/index.html")
        self.wait_for_pyscript()
        assert self.page.title() == "Raycaster"
        wait_for_render(self.page, "*", "<canvas.*?>")
