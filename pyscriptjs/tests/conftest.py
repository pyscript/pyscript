"""All data required for testing examples"""

import pytest

default_values = {
    "MAX_TEST_TIME": 30,  # Number of seconds allowed for checking a testing condition
    "TEST_TIME_INCREMENT": 0.25,  # 1/4 second, the length of each iteration
    "BASE_URL": "http://127.0.0.1:8080",
}

# Content that is displayed while pyodide loads
loading_messages = [
    "Loading runtime...",
    "Runtime created...",
    "Initializing components...",
    "Initializing scripts...",
]

# Base names
examples = [
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

# The examples' HTML files that are served when running app
files = {
    "altair": "altair.html",
    "bokeh": "bokeh.html",
    "bokeh_interactive": "bokeh_interactive.html",
    "d3": "d3.html",
    "folium": "folium.html",
    "hello_world": "hello_world.html",
    "matplotlib": "matplotlib.html",
    "numpy_canvas_fractals": "numpy_canvas_fractals.html",
    "panel": "panel.html",
    "panel_deckgl": "panel_deckgl.html",
    "panel_kmeans": "panel_kmeans.html",
    "panel_stream": "panel_stream.html",
    "repl": "repl.html",
    "repl2": "repl2.html",
    "simple_clock": "simple_clock.html",
    "todo": "todo.html",
    "todo_pylist": "todo-pylist.html",
    "toga_freedom": "toga/freedom.html",
    "webgl_raycaster_index": "webgl/raycaster/index.html",
}

# Each example's page title
titles = {
    "altair": "Altair",
    "bokeh": "Bokeh Example",
    "bokeh_interactive": "Bokeh Example",
    "d3": "d3: JavaScript & PyScript visualizations side-by-side",
    "folium": "Folium",
    "hello_world": "PyScript Hello World",
    "matplotlib": "Matplotlib",
    "numpy_canvas_fractals": "Visualization of Mandelbrot, Julia and Newton sets with NumPy and HTML5 canvas",
    "numpy_canvas_fractals": (
        "Visualization of Mandelbrot, Julia and Newton"
        " sets with NumPy and HTML5 canvas"
    ),
    "panel": "Panel Example",
    "panel_deckgl": "PyScript/Panel DeckGL Demo",
    "panel_kmeans": "Pyscript/Panel KMeans Demo",
    "panel_stream": "PyScript/Panel Streaming Demo",
    "repl": "REPL",
    "repl2": "Custom REPL Example",
    "simple_clock": "Simple Clock Demo",
    "todo": "Todo App",
    "todo_pylist": "Todo App",
    "toga_freedom": ["Loading...", "Freedom Units"],
    "webgl_raycaster_index": "Raycaster",
}

# Regex patterns to look for post-rendering page content
patterns = {
    "altair": r"<canvas.*?class=\"marks\".*?>",  # canvas tag
    "bokeh": r"<div.*class=\"bk\".*>",  # <div class="bk"...>
    "bokeh_interactive": r"<div.*?class=\"bk\".*?>",  # <div class="bk"...>
    "d3": r"<svg.*?>",  # svg tag
    "folium": r"<iframe srcdoc=",  # iframe tag
    "hello_world": r"\d+/\d+/\d+, \d+:\d+:\d+",  # Timestamp
    "matplotlib": r"""<img src=['"]data:image""",  # <img> tag with data
    "numpy_canvas_fractals": r"""<div.*?id=['"](mandelbrot|julia|newton)['"].*?>""",
    "panel": r"""<div.*?class=['"]bk-root['"].*?>""",  # <div class="bk-root"...>
    "panel_deckgl": r"""<div.*?class=['"]bk-root['"].*?>""",  # <div class="bk-root"...>
    "panel_kmeans": r"""<div.*?class=['"]bk-root['"].*?>""",  # <div class="bk-root"...>
    "panel_stream": r"""<div.*?class=['"]bk-root['"].*?>""",  # <div class="bk-root"...>
    "repl": r"""<py-repl.*?>""",  # <py-repl> tag
    "repl2": r"""<py-repl.*?>""",  # <py-repl> tag
    "simple_clock": r"\d+/\d+/\d+, \d+:\d+:\d+",  # Timestamp
    "todo": r"""<input.*?id=['"]new-task-content['"].*?>""",  # <input> with id
    "todo_pylist": r"""<input.*?id=['"]new-task-content['"].*?>""",  # <input> with id
    "toga_freedom": r"""<(main|div).*?id=['"]toga_\d+['"].*?>""",  # main or div with id
    "webgl_raycaster_index": r"<canvas.*?>",  # canvas tag
}


@pytest.fixture(scope="session")
def config() -> dict:
    return {
        "default_values": default_values,
        "loading_messages": loading_messages,
        "examples": examples,
        "titles": titles,
        "files": files,
        "patterns": patterns,
    }
