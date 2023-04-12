# `display(*values, target=None, append=True)`

## Parameters

`*values` - the objects to be displayed. String objects are output as-written. For non-string objects, the default content to display is the the object's {py:func}`repr`. Objects may implement the following methods to indicate that they should be displayed as a different MIME type. MIME types with a * indicate that the content will be wrapped in the appropriate html tags and attributes before output:


| Method              | Inferred MIME type     |
|---------------------|------------------------|
| `__repr__`          | text/plain             |
| `_repr_html_`       | text/html              |
| `_repr_svg_`        | image/svg+xml          |
| `_repr_png_`        | image/png*             |
| `_repr_pdf_`        | application/pdf        |
| `_repr_jpeg_`       | image/jpeg*            |
| `_repr_json_`       | application/json       |
| `_repr_javascript_` | application/javascript*|
| `savefig`           | image/png              |
|                     |                        |

`target` - Element's ID. The default value for `target` is the current `py-script` tag ID, it's possible to specify different IDs for this parameter

`append` - `boolean` if the output is going to be appended or not to the `target`ed element. It creates a `<div>` tag if `True` and a `<py-script>` tag with a random ID if `False`. The default value for `append` is `True`.

### Description

Display is the default function to display objects on the screen. Functions like the Python `print()` or JavaScript `console.log()` are now defaulted to only appear on the terminal.

Display will throw an exception if the target is not clear. E.g. the following code is invalid:

```html
<py-script>
    def display_hello():
        # this fails because we don't have any implicit target
        # from event handlers
        display('hello')
</py-script>
<button id="my-button" py-click="display_hello()">Click me</button>
```

Because it's considered unclear if the `hello` string should be displayed underneath the `<py-script>` tag or the `<button>` tag.

To write compliant code, make sure to specify the target using the `target` parameter, for example:

```html
<py-script>
    def display_hello():
        # this works because we give an explicit target
        display('hello', target="helloDiv")
</py-script>
<div id="helloDiv"></div>
<button id="my-button" py-click="display_hello()">Click me</button>
```

#### Using matplotlib with display

`matplotlib` has two ways of plotting things as mentioned [here](https://matplotlib.org/matplotblog/posts/pyplot-vs-object-oriented-interface/)

- In case of using the `pyplot` interface, the graph can be shown using `display(plt)`.

```python
import matplotlib.pyplot as plt
import numpy as np

# Data for plotting
t = np.arange(0.0, 2.0, 0.01)
s = 1 + np.sin(2 * np.pi * t)
plt.plot(t,s)

display(plt)
```

- In case of using the `object oriented` interface, the graph can be shown using `display(fig)` or `display(plt)` both.

```python
import matplotlib.pyplot as plt
import numpy as np

# Data for plotting
t = np.arange(0.0, 2.0, 0.01)
s = 1 + np.sin(2 * np.pi * t)

fig, ax = plt.subplots()
ax.plot(t, s)

display(fig) # but even display(plt) would have worked!
```
