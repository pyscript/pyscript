"""
Display Pythonic content in the browser.

This module provides the `display()` function for rendering Python objects
in the web page. The function introspects objects to determine the appropriate
[MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types)
and rendering method.

Supported MIME types:

- `text/plain`: Plain text (HTML-escaped)
- `text/html`: HTML content
- `image/png`: PNG images as data URLs
- `image/jpeg`: JPEG images as data URLs
- `image/svg+xml`: SVG graphics
- `application/json`: JSON data
- `application/javascript`: JavaScript code (discouraged)

The `display()` function uses standard Python representation methods
(`_repr_html_`, `_repr_png_`, etc.) to determine how to render objects.
Objects can provide a `_repr_mimebundle_` method to specify preferred formats
like this:

```python
def _repr_mimebundle_(self):
    return {
        "text/html": "<b>Bold HTML</b>",
        "image/png": "<base64-encoded-png-data>",
    }
```

Heavily inspired by
[IPython's rich display system](https://ipython.readthedocs.io/en/stable/api/generated/IPython.display.html).
"""

import base64
import html
import io
from collections import OrderedDict
from pyscript.context import current_target, document, window
from pyscript.ffi import is_none


def _render_image(mime, value, meta):
    """
    Render image (`mime`) data (`value`) as an HTML img element with data URL.
    Any `meta` attributes are added to the img tag.

    Accepts both raw bytes and base64-encoded strings for flexibility.
    """
    if isinstance(value, bytes):
        value = base64.b64encode(value).decode("utf-8")
    attrs = "".join([f' {k}="{v}"' for k, v in meta.items()])
    return f'<img src="data:{mime};base64,{value}"{attrs}>'


# Maps MIME types to rendering functions.
_MIME_TO_RENDERERS = {
    "text/plain": lambda v, m: html.escape(v),
    "text/html": lambda v, m: v,
    "image/png": lambda v, m: _render_image("image/png", v, m),
    "image/jpeg": lambda v, m: _render_image("image/jpeg", v, m),
    "image/svg+xml": lambda v, m: v,
    "application/json": lambda v, m: v,
    "application/javascript": lambda v, m: f"<script>{v}<\\/script>",
}


# Maps Python representation methods to MIME types. This is an ordered dict
# because the order defines preference when multiple methods are available,
# and MicroPython's limited dicts don't preserve insertion order.
_METHOD_TO_MIME = OrderedDict(
    [
        ("savefig", "image/png"),
        ("_repr_png_", "image/png"),
        ("_repr_jpeg_", "image/jpeg"),
        ("_repr_svg_", "image/svg+xml"),
        ("_repr_html_", "text/html"),
        ("_repr_json_", "application/json"),
        ("_repr_javascript_", "application/javascript"),
        ("__repr__", "text/plain"),
    ]
)


class HTML:
    """
    Wrap a string to render as unescaped HTML in `display()`. This is
    necessary because plain strings are automatically HTML-escaped for safety:

    ```python
    from pyscript import HTML, display


    display(HTML("<h1>Hello World</h1>"))
    ```

    Inspired by
    [`IPython.display.HTML`](https://ipython.readthedocs.io/en/stable/api/generated/IPython.display.html#IPython.display.HTML).
    """

    def __init__(self, html):
        self._html = html

    def _repr_html_(self):
        return self._html


def _get_representation(obj, method):
    """
    Call the given representation `method` on an object (`obj`).

    Handles special cases like matplotlib's `savefig`. Returns `None`
    if the `method` doesn't exist.
    """
    if method == "__repr__":
        return repr(obj)
    if not hasattr(obj, method):
        return None
    if method == "savefig":
        buf = io.BytesIO()
        obj.savefig(buf, format="png")
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")
    return getattr(obj, method)()


def _get_content_and_mime(obj):
    """
    Returns the formatted raw content to be inserted into the DOM representing
    the given object, along with the object's detected MIME type.

    Returns a tuple of (html_string, mime_type).

    Prefers _repr_mimebundle_ if available, otherwise tries individual
    representation methods, falling back to __repr__ (with a warning in
    the console).

    Implements a subset of IPython's rich display system (mimebundle support,
    etc...).
    """
    if isinstance(obj, str):
        return html.escape(obj), "text/plain"
    # Prefer an object's mimebundle.
    mimebundle = _get_representation(obj, "_repr_mimebundle_")
    if mimebundle:
        if isinstance(mimebundle, tuple):
            # Grab global metadata.
            format_dict, global_meta = mimebundle
        else:
            format_dict, global_meta = mimebundle, {}
        # Try to render using mimebundle formats.
        for mime_type, output in format_dict.items():
            if mime_type in _MIME_TO_RENDERERS:
                meta = global_meta.get(mime_type, {})
                # If output is a tuple, merge format-specific metadata.
                if isinstance(output, tuple):
                    output, format_meta = output
                    meta.update(format_meta)
                return _MIME_TO_RENDERERS[mime_type](output, meta), mime_type
    # No mimebundle or no available renderers therein, so try individual
    # methods.
    for method, mime_type in _METHOD_TO_MIME.items():
        if mime_type not in _MIME_TO_RENDERERS:
            continue
        output = _get_representation(obj, method)
        if output is None:
            continue
        meta = {}
        if isinstance(output, tuple):
            output, meta = output
        return _MIME_TO_RENDERERS[mime_type](output, meta), mime_type
    # Ultimate fallback to repr with warning.
    window.console.warn(
        f"Object {type(obj).__name__} has no supported representation method. "
        "Using __repr__ as fallback."
    )
    output = repr(obj)
    return html.escape(output), "text/plain"


def _write_to_dom(element, value, append):
    """
    Given an `element` and a `value`, write formatted content to the referenced
    DOM element. If `append` is True, content is added to the existing content;
    otherwise, the existing content is replaced.

    Creates a wrapper `div` when appending multiple items to preserve
    structure.
    """
    html_content, mime_type = _get_content_and_mime(value)
    if not html_content.strip():
        return
    if append:
        container = document.createElement("div")
        element.append(container)
    else:
        container = element
    if mime_type in ("application/javascript", "text/html"):
        container.append(document.createRange().createContextualFragment(html_content))
    else:
        container.innerHTML = html_content


def display(*values, target=None, append=True):
    """
    Display Python objects in the web page.

    * `*values`: Python objects to display. Each object is introspected to
      determine the appropriate rendering method.
    * `target`: DOM element ID where content should be displayed. If `None`
      (default), uses the current script tag's designated output area. This
      can start with '#' (which will be stripped for compatibility).
    * `append`: If `True` (default), add content to existing output. If
      `False`, replace existing content before displaying.

    When used in a worker, `display()` requires an explicit `target` parameter
    to identify where content will be displayed. If used on the main thread,
    it automatically uses the current `<script>` tag as the target. If the
    script tag has a `target` attribute, that element will be used instead.

    A ValueError is raised if a valid target cannot be found for the current
    context.

    ```python
    from pyscript import display, HTML


    # Display raw HTML.
    display(HTML("<h1>Hello, World!</h1>"))

    # Display in current script's output area.
    display("Hello, World!")

    # Display in a specific element.
    display("Hello", target="my-div")

    # Replace existing content (note the `#`).
    display("New content", target="#my-div", append=False)

    # Display multiple values in the default target.
    display("First", "Second", "Third")
    ```
    """
    if isinstance(target, str):
        # There's a valid target.
        target = target[1:] if target.startswith("#") else target
    elif is_none(target):
        target = current_target()
    element = document.getElementById(target)
    if is_none(element):
        raise ValueError(f"Cannot find element with id='{target}' in the page.")
    # If possible, use a script tag's target attribute.
    if element.tagName == "SCRIPT" and hasattr(element, "target"):
        element = element.target
    # Clear before displaying all values when not appending.
    if not append:
        element.replaceChildren()
    # Add each value.
    for value in values:
        _write_to_dom(element, value, append)
