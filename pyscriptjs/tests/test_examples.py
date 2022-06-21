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
        "file": "altair.html",
        "pattern": '<canvas.*?class=\\"marks\\".*?>',
        "title": "Altair",
    },
    "bokeh": {
        "file": "bokeh.html",
        "pattern": '<div.*class=\\"bk\\".*>',
        "title": "Bokeh Example",
    },
    "bokeh_interactive": {
        "file": "bokeh_interactive.html",
        "pattern": '<div.*?class=\\"bk\\".*?>',
        "title": "Bokeh Example",
    },
    "d3": {
        "file": "d3.html",
        "pattern": "<svg.*?>",
        "title": "d3: JavaScript & PyScript visualizations side-by-side",
    },
    "folium": {"file": "folium.html", "pattern": "<iframe srcdoc=", "title": "Folium"},
    "hello_world": {
        "file": "hello_world.html",
        "pattern": "\\d+/\\d+/\\d+, \\d+:\\d+:\\d+",
        "title": "PyScript Hello World",
    },
    "matplotlib": {
        "file": "matplotlib.html",
        "pattern": "<img src=['\"]data:image",
        "title": "Matplotlib",
    },
    "numpy_canvas_fractals": {
        "file": "numpy_canvas_fractals.html",
        "pattern": "<div.*?id=['\"](mandelbrot|julia|newton)['\"].*?>",
        "title": "Visualization of Mandelbrot, Julia and "
        "Newton sets with NumPy and HTML5 canvas",
    },
    "panel": {
        "file": "panel.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "Panel Example",
    },
    "panel_deckgl": {
        "file": "panel_deckgl.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "PyScript/Panel DeckGL Demo",
    },
    "panel_kmeans": {
        "file": "panel_kmeans.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "Pyscript/Panel KMeans Demo",
    },
    "panel_stream": {
        "file": "panel_stream.html",
        "pattern": "<div.*?class=['\"]bk-root['\"].*?>",
        "title": "PyScript/Panel Streaming Demo",
    },
    "repl": {"file": "repl.html", "pattern": "<py-repl.*?>", "title": "REPL"},
    "repl2": {
        "file": "repl2.html",
        "pattern": "<py-repl.*?>",
        "title": "Custom REPL Example",
    },
    "simple_clock": {
        "file": "simple_clock.html",
        "pattern": "\\d+/\\d+/\\d+, \\d+:\\d+:\\d+",
        "title": "Simple Clock Demo",
    },
    "todo": {
        "file": "todo.html",
        "pattern": "<input.*?id=['\"]new-task-content['\"].*?>",
        "title": "Todo App",
    },
    "todo_pylist": {
        "file": "todo-pylist.html",
        "pattern": "<input.*?id=['\"]new-task-content['\"].*?>",
        "title": "Todo App",
    },
    "toga_freedom": {
        "file": "toga/freedom.html",
        "pattern": "<(main|div).*?id=['\"]toga_\\d+['\"].*?>",
        "title": ["Loading...", "Freedom Units"],
    },
    "webgl_raycaster_index": {
        "file": "webgl/raycaster/index.html",
        "pattern": "<canvas.*?>",
        "title": "Raycaster",
    },
}


@pytest.mark.parametrize("example", EXAMPLES)
def test_examples(example, http_server, page):

    base_url = http_server
    example_path = urljoin(base_url, TEST_PARAMS[example]["file"])

    page.goto(example_path, wait_until="commit")

    content = page.text_content("*")
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

    pyodide_loading = False  # Flag to be set to True when condition met

    for _ in range(TEST_ITERATIONS):
        for message in LOADING_MESSAGES:
            if message in content:
                pyodide_loading = True
        if pyodide_loading:
            break
        content = page.text_content("*")
        time.sleep(TEST_TIME_INCREMENT)

    assert pyodide_loading  # nosec

    # STEP 3:
    # Assert that rendering inserts data into the page as expected: search the
    # DOM from within the timing loop for a string that is not present in the
    # initial markup but should appear by way of rendering

    re_sub_content = re.compile(TEST_PARAMS[example]["pattern"])
    py_rendered = False  # Flag to be set to True when condition met

    for _ in range(TEST_ITERATIONS):
        time.sleep(TEST_TIME_INCREMENT)
        content = page.inner_html("*")
        if re_sub_content.search(content):
            py_rendered = True
            break

    assert py_rendered  # nosec
