"""Run all tests in CLI mode so that the results of print() statements are displayed"""

from test_altair import test as test_altair
from test_bokeh import test as test_bokeh
from test_bokeh_interactive import test as test_bokeh_interactive
from test_d3 import test as test_d3
from test_folium import test as test_folium
from test_hello_world import test as test_hello_world
from test_matplotlib import test as test_matplotlib

# from test_toga_freedom import test as test_toga_freedom
from test_numpy_canvas_fractals import test as test_numpy_canvas_fractals
from test_panel import test as test_panel
from test_panel_deckgl import test as test_panel_deckgl
from test_panel_kmeans import test as test_panel_kmeans
from test_panel_stream import test as test_panel_stream
from test_repl import test as test_repl
from test_repl2 import test as test_repl2
from test_simple_clock import test as test_simple_clock
from test_todo import test as test_todo
from test_todo_pylist import test as test_todo_pylist
from test_webgl_raycaster_index import test as test_webgl_raycaster_index

test_hello_world()
test_simple_clock()
test_repl()
test_repl2()
test_todo()
test_todo_pylist()
test_matplotlib()
test_altair()
test_folium()
test_d3()
test_webgl_raycaster_index()
test_bokeh()
test_bokeh_interactive()
test_panel_kmeans()
test_panel_stream()
test_panel()
test_panel_deckgl()
test_toga_freedom()
test_numpy_canvas_fractals()
