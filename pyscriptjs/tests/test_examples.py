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
from urllib.parse import urljoin

import pytest

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

EXAMPLES = [
    "altair",
    "bokeh",
    "bokeh_interactive",
    "d3",
    "folium",
    "hello_world",
    "matplotlib",
    "numpy_canvas_fractals",
    "panel",
    "panel_deckgl",
    "panel_kmeans",
    "panel_stream",
    "repl",
    "repl2",
    "simple_clock",
    "todo",
    "todo_pylist",
    "toga_freedom",
    "webgl_raycaster_index",
]

TEST_PARAMS = {
    "altair": {
        "file": "examples/altair.html",
        "pattern": '<canvas.*?class=\\"marks\\".*?>',
        "title": "Altair",
    },
    "bokeh": {
        "file": "examples/bokeh.html",
        "pattern": '<div.*class=\\"bk\\".*>',
        "title": "Bokeh Example",
    },
    "bokeh_interactive": {
        "file": "examples/bokeh_interactive.html",
        "pattern": '<div.*?class=\\"bk\\".*?>',
        "title": "Bokeh Example",
    },
    "d3": {
        "file": "examples/d3.html",
        "pattern": "<svg.*?>",
        "title": "d3: JavaScript & PyScript visualizations side-by-side",
    },
    "folium": {
        "file": "examples/folium.html",
        "pattern": "<iframe srcdoc=",
        "title": "Folium",
    },
    "hello_world": {
        "file": "examples/hello_world.html",
        "pattern": "\\d+/\\d+/\\d+, \\d+:\\d+:\\d+",
        "title": "PyScript Hello World",
    },
    "matplotlib": {
        "file": "examples/matplotlib.html",
        "pattern": "<img src=['\"]data:image",
        "title": "Matplotlib",
    },
    "numpy_canvas_fractals": {
        "file": "examples/numpy_canvas_fractals.html",
        "pattern": "<div.*?id=['\"](mandelbrot|julia|newton)['\"].*?>",
        "title": "Visualization of Mandelbrot, Julia and "
        "Newton sets with NumPy and HTML5 canvas",
    },
    "panel": {
        "file": "examples/panel.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "Panel Example",
    },
    "panel_deckgl": {
        "file": "examples/panel_deckgl.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "PyScript/Panel DeckGL Demo",
    },
    "panel_kmeans": {
        "file": "examples/panel_kmeans.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "Pyscript/Panel KMeans Demo",
    },
    "panel_stream": {
        "file": "examples/panel_stream.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "PyScript/Panel Streaming Demo",
    },
    "repl": {"file": "examples/repl.html", "pattern": "<py-repl.*?>", "title": "REPL"},
    "repl2": {
        "file": "examples/repl2.html",
        "pattern": "<py-repl.*?>",
        "title": "Custom REPL Example",
    },
    "simple_clock": {
        "file": "examples/simple_clock.html",
        "pattern": "\\d+/\\d+/\\d+, \\d+:\\d+:\\d+",
        "title": "Simple Clock Demo",
    },
    "todo": {
        "file": "examples/todo.html",
        "pattern": "<input.*?id=['\"]new-task-content['\"].*?>",
        "title": "Todo App",
    },
    "todo_pylist": {
        "file": "examples/todo-pylist.html",
        "pattern": "<input.*?id=['\"]new-task-content['\"].*?>",
        "title": "Todo App",
    },
    "toga_freedom": {
        "file": "examples/toga/freedom.html",
        "pattern": "<(main|div).*?id=['\"]toga_\\d+['\"].*?>",
        "title": ["Loading...", "Freedom Units"],
    },
    "webgl_raycaster_index": {
        "file": "examples/webgl/raycaster/index.html",
        "pattern": "<canvas.*?>",
        "title": "Raycaster",
    },
}


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


@pytest.mark.parametrize("example", EXAMPLES)
def test_examples(example, http_server, page):
    base_url = http_server
    example_path = urljoin(base_url, TEST_PARAMS[example]["file"])

    page.goto(example_path, wait_until="commit")

    title = page.title()

    # STEP 1: Check page title proper initial loading of the example page
    expected_title = TEST_PARAMS[example]["title"]
    if isinstance(expected_title, list):
        # One example's title changes so expected_title is a list of possible
        # titles in that case
        assert title in expected_title  # nosec
    else:
        assert title == expected_title  # nosec

    # STEP 2: Test that pyodide is loading via messages displayed during loading
    wait_for_load(page)

    # Step 3: Wait for expected pattern to appear on page
    wait_for_render(page, "*", TEST_PARAMS[example]["pattern"])


def test_simple_clock(http_server, page):
    example_path = urljoin(http_server, TEST_PARAMS["simple_clock"]["file"])

    page.goto(example_path, wait_until="commit")

    wait_for_load(page)

    pattern = r"\d{2}/\d{2}/\d{4}, \d{2}:\d{2}:\d{2}"
    for _ in range(TEST_ITERATIONS):
        content = page.inner_html("#outputDiv2")
        if re.match(pattern, content) and int(content[-1]) in (0, 4, 8):
            assert page.inner_html("#outputDiv3") == "It's espresso time!"
            break
        else:
            time.sleep(TEST_TIME_INCREMENT)
