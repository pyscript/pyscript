import js
import json
from pyscript import window, document
from polyscript import xworker

import panel as pn
from panel.io.pyodide import init_doc, write_doc

from js import JSON
from pyodide.ffi import create_once_callable, create_proxy, to_js

js.document = document
init_doc()

print("Hello from panel.py")

slider = pn.widgets.FloatSlider(start=0, end=10, name="Amplitude")


def callback(new):
    print(f"Amplitude is: {new}")
    return f"Amplitude is: {new}"


print("made this far...")
pn.Row(slider, pn.bind(callback, slider)).servable(target="simple_app")

# ------ END OF PANEL CODE ------

docs_json_str, render_items_str, root_ids_str = await write_doc()
docs_json = JSON.parse(docs_json_str)  # .as_object_map()
# render_items = to_js(JSON.parse(render_items_str), depth=-1, pyproxies=None, create_pyproxies=False, dict_converter=js.Object.fromEntries)#.as_object_map()
root_ids = JSON.parse(root_ids_str)  # .as_object_map()

# docs_json = json.loads(docs_json_str)
render_items = json.loads(render_items_str)
# root_ids = json.loads(root_ids_str)

print(type(render_items))
root_elements = document.querySelectorAll("[data-root-id]")
data_roots = []
for el in root_elements:
    el.innerHTML = ""
    data_roots.append([el.getAttribute("data-root-id"), el.id])

roots = {root_ids[i]: root for i, root in enumerate(data_roots)}

print("Quick check")
print(roots)
print(root_ids)
print(render_items)
# render_items[0]['roots'] = roots
# render_items[0]['root_ids'] = root_ids
# render_items[0].roots = to_js(roots)
# render_items[0].root_ids = to_js(root_ids)


# print(roots)
# print(data_roots)
print(docs_json)
print(render_items)
print("here....")

# views = await window.Bokeh.embed.embed_items(to_js(docs_json), to_js(render_items))
views = await window.Bokeh.embed.embed_items(
    docs_json,  # to_js(docs_json, depth=-1, pyproxies=None, create_pyproxies=False, dict_converter=js.Object.fromEntries),
    to_js(
        render_items,
        depth=-1,
        pyproxies=None,
        create_pyproxies=False,
        dict_converter=js.Object.fromEntries,
    ),
)

# Experiments back to main thread
# await xworker.sync.render_full(docs_json_str, render_items_str, root_ids_str)
print("made it to the end")
print(docs_json)
