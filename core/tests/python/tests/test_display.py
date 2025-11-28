"""
Tests for the display function in PyScript.
"""

import asyncio
import json

import upytest
from pyscript import HTML, RUNNING_IN_WORKER, display, py_import, web


async def get_display_container():
    """
    Get the element that contains the output of the display function.
    """
    if RUNNING_IN_WORKER:
        # Needed to ensure the DOM has time to catch up with the display calls
        # made in the worker thread.
        await asyncio.sleep(0.01)
    py_display = web.page.find("script-py")
    if len(py_display) == 1:
        return py_display[0]
    mpy_display = web.page.find("script-mpy")
    if len(mpy_display) == 1:
        return mpy_display[0]
    return None


async def setup():
    """
    Setup function for the test_display.py module. Remove all references to the
    display output in the DOM so we always start from a clean state.
    """
    container = await get_display_container()
    if container:
        container.replaceChildren()
    target_container = web.page.find("#test-element-container")[0]
    target_container.innerHTML = ""


async def teardown():
    """
    Like setup.
    """
    container = await get_display_container()
    if container:
        container.replaceChildren()
    target_container = web.page.find("#test-element-container")[0]
    target_container.innerHTML = ""


async def test_simple_display():
    """
    Test the display function with a simple string.
    """
    display("Hello, world")
    container = await get_display_container()
    assert len(container.children) == 1, "Expected one child in the display container."
    assert (
        container.children[0].tagName == "DIV"
    ), "Expected a div element in the display container."
    assert container.children[0].innerHTML == "Hello, world"


async def test_consecutive_display():
    """
    Display order should be preserved.
    """
    display("hello 1")
    display("hello 2")
    container = await get_display_container()
    assert (
        len(container.children) == 2
    ), "Expected two children in the display container."
    assert container.children[0].innerHTML == "hello 1"
    assert container.children[1].innerHTML == "hello 2"


def test_target_parameter():
    """
    The output from display is placed in the target element.
    """
    display("hello world", target="test-element-container")
    target = web.page.find("#test-element-container")[0]
    assert target.innerText == "hello world"


def test_target_parameter_with_hash():
    """
    The target parameter can have a hash in front of it.
    """
    display("hello world", target="#test-element-container")
    target = web.page.find("#test-element-container")[0]
    assert target.innerText == "hello world"


def test_non_existing_id_target_raises_value_error():
    """
    If the target parameter is set to a non-existing element, a ValueError should be raised.
    """
    with upytest.raises(ValueError):
        display("hello world", target="non-existing")


def test_empty_string_target_raises_value_error():
    """
    If the target parameter is an empty string, a ValueError should be raised.
    """
    with upytest.raises(ValueError) as exc:
        display("hello world", target="")
    assert str(exc.exception) == "Cannot find element with id='' in the page."


async def test_tag_target_attribute():
    """
    The order and arrangement of the display calls (including targets) should be preserved.
    """
    display("item 1")
    display("item 2", target="test-element-container")
    display("item 3")
    container = await get_display_container()
    assert (
        len(container.children) == 2
    ), "Expected two children in the display container."
    assert container.children[0].innerHTML == "item 1"
    assert container.children[1].innerHTML == "item 3"
    target = web.page.find("#test-element-container")[0]
    assert target.innerText == "item 2"


async def test_multiple_display_calls_same_tag():
    """
    Multiple display calls in the same script tag should be displayed in order.
    """
    display("item 1")
    display("item 2")
    container = await get_display_container()
    assert (
        len(container.children) == 2
    ), "Expected two children in the display container."
    assert container.children[0].innerHTML == "item 1"
    assert container.children[1].innerHTML == "item 2"


async def test_append_true():
    """
    Explicit append flag as true should append to the expected container element.
    """
    display("item 1", append=True)
    display("item 2", append=True)
    container = await get_display_container()
    assert (
        len(container.children) == 2
    ), "Expected two children in the display container."
    assert container.children[0].innerHTML == "item 1"
    assert container.children[1].innerHTML == "item 2"


async def test_append_false():
    """
    Explicit append flag as false should replace the expected container element.
    """
    display("item 1", append=False)
    display("item 2", append=False)
    container = await get_display_container()
    assert container.innerText == "item 2"


async def test_display_multiple_values():
    """
    Display multiple values in the same call.
    """
    display("hello", "world")
    container = await get_display_container()
    assert container.innerText == "hello\nworld", container.innerText


async def test_display_multiple_append_false():
    display("hello", "world", append=False)
    container = await get_display_container()
    assert container.innerText == "world"


def test_display_multiple_append_false_with_target():
    """
    TODO: this is a display.py issue to fix when append=False is used
          do not use the first element, just clean up and then append
          remove the # display comment once that's done
    """

    class Circle:
        r = 0

        def _repr_svg_(self):
            return (
                f'<svg height="{self.r*2}" width="{self.r*2}">'
                f'<circle cx="{self.r}" cy="{self.r}" r="{self.r}" fill="red"></circle></svg>'
            )

    circle = Circle()
    circle.r += 5
    display(circle, circle, target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    assert target.innerHTML == circle._repr_svg_()


async def test_display_list_dict_tuple():
    """
    Display a list, dictionary, and tuple with the expected __repr__.

    NOTE: MicroPython doesn't (yet) have ordered dicts. Hence the rather odd
    check that the dictionary is displayed as a string.
    """
    l = ["A", 1, "!"]
    d = {"B": 2, "List": l}
    t = ("C", 3, "!")
    display(l, d, t)
    container = await get_display_container()
    l2, d2, t2 = container.innerText.split("\n")
    assert l == eval(l2)
    assert d == eval(d2)
    assert t == eval(t2)


async def test_display_should_escape():
    display("<p>hello world</p>")
    container = await get_display_container()
    assert container[0].innerHTML == "&lt;p&gt;hello world&lt;/p&gt;"
    assert container.innerText == "<p>hello world</p>"


async def test_display_HTML():
    display(HTML("<p>hello world</p>"))
    container = await get_display_container()
    assert container[0].innerHTML == "<p>hello world</p>"
    assert container.innerText == "hello world"


@upytest.skip(
    "Pyodide main thread only",
    skip_when=upytest.is_micropython or RUNNING_IN_WORKER,
)
async def test_image_display():
    """
    Check an image is displayed correctly.
    """
    _mpl = await py_import("matplotlib")
    import matplotlib.pyplot as plt

    xpoints = [3, 6, 9]
    ypoints = [1, 2, 3]
    plt.plot(xpoints, ypoints)
    display(plt)
    container = await get_display_container()
    img = container.find("img")[0]
    img_src = img.getAttribute("src").replace(
        "data:image/png;charset=utf-8;base64,", ""
    )
    assert len(img_src) > 0


@upytest.skip(
    "Pyodide main thread only",
    skip_when=upytest.is_micropython or RUNNING_IN_WORKER,
)
async def test_image_renders_correctly():
    """
    This is just a sanity check to make sure that images are rendered
    in a reasonable way.
    """
    from PIL import Image

    img = Image.new("RGB", (4, 4), color=(0, 0, 0))
    display(img, target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    assert img.src.startswith("data:image/png;base64"), img.src


async def test_mimebundle_simple():
    """
    An object with _repr_mimebundle_ should use the mimebundle formats.
    """

    class MimebundleObj:
        def _repr_mimebundle_(self):
            return {
                "text/html": "<strong>Bold HTML</strong>",
                "text/plain": "Plain text fallback",
            }

    display(MimebundleObj())
    container = await get_display_container()
    # Should prefer HTML from mimebundle.
    assert container[0].innerHTML == "<strong>Bold HTML</strong>"


async def test_mimebundle_with_metadata():
    """
    Mimebundle can include metadata for specific MIME types.
    """

    class ImageWithMeta:
        def _repr_mimebundle_(self):
            return (
                {
                    "image/png": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                },
                {"image/png": {"width": "100", "height": "50"}},
            )

    display(ImageWithMeta(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    assert img.getAttribute("width") == "100"
    assert img.getAttribute("height") == "50"


async def test_mimebundle_with_tuple_output():
    """
    Mimebundle format values can be tuples with (data, metadata).
    """

    class TupleOutput:
        def _repr_mimebundle_(self):
            return {"text/html": ("<em>Italic</em>", {"custom": "meta"})}

    display(TupleOutput())
    container = await get_display_container()
    assert container[0].innerHTML == "<em>Italic</em>"


async def test_mimebundle_metadata_merge():
    """
    Format-specific metadata should merge with global metadata.
    """

    class MetaMerge:
        def _repr_mimebundle_(self):
            return (
                {
                    "image/png": (
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                        {"height": "75"},
                    )
                },
                {"image/png": {"width": "100"}},
            )

    display(MetaMerge(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    # Both global and format-specific metadata should be present.
    assert img.getAttribute("width") == "100"
    assert img.getAttribute("height") == "75"


async def test_mimebundle_unsupported_mime():
    """
    If mimebundle contains only unsupported MIME types, fall back to regular methods.
    """

    class UnsupportedMime:
        def _repr_mimebundle_(self):
            return {"application/pdf": "PDF data", "text/latex": "LaTeX data"}

        def _repr_html_(self):
            return "<p>HTML fallback</p>"

    display(UnsupportedMime())
    container = await get_display_container()
    # Should fall back to _repr_html_.
    assert container[0].innerHTML == "<p>HTML fallback</p>"


async def test_mimebundle_no_dict():
    """
    Mimebundle that returns just a dict (no tuple) should work.
    """

    class SimpleMimebundle:
        def _repr_mimebundle_(self):
            return {"text/html": "<code>Code</code>"}

    display(SimpleMimebundle())
    container = await get_display_container()
    assert container[0].innerHTML == "<code>Code</code>"


async def test_repr_html():
    """
    Objects with _repr_html_ should render as HTML.
    """

    class HTMLRepr:
        def _repr_html_(self):
            return "<h1>HTML Header</h1>"

    display(HTMLRepr())
    container = await get_display_container()
    assert container[0].innerHTML == "<h1>HTML Header</h1>"


async def test_repr_html_with_metadata():
    """
    _repr_html_ can return (html, metadata) tuple.
    """

    class HTMLWithMeta:
        def _repr_html_(self):
            return ("<p>Paragraph</p>", {"data-custom": "value"})

    display(HTMLWithMeta())
    container = await get_display_container()
    # Metadata is not used in _repr_html_ rendering, but ensure HTML is
    # correct.
    assert container[0].innerHTML == "<p>Paragraph</p>"


async def test_repr_svg():
    """
    Objects with _repr_svg_ should render as SVG.
    """

    class SVGRepr:
        def _repr_svg_(self):
            return '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>'

    display(SVGRepr(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    assert "svg" in target.innerHTML.lower()
    assert "circle" in target.innerHTML.lower()


async def test_repr_json():
    """
    Objects with _repr_json_ should render as JSON.
    """

    class JSONRepr:
        def _repr_json_(self):
            return '{"key": "value", "number": 42}'

    display(JSONRepr(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    assert '"key": "value"' in target.innerHTML
    value = json.loads(target.innerText)
    assert value["key"] == "value"
    assert value["number"] == 42


async def test_repr_png_bytes():
    """
    _repr_png_ can render raw bytes.
    """

    class PNGBytes:
        def _repr_png_(self):
            # Valid 1x1 transparent PNG as bytes.
            return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    display(PNGBytes(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    assert img.src.startswith("data:image/png;base64,")


async def test_repr_png_base64():
    """
    _repr_png_ can render a base64-encoded string.
    """

    class PNGBase64:
        def _repr_png_(self):
            return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    display(PNGBase64(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    assert img.src.startswith("data:image/png;base64,")


async def test_repr_jpeg():
    """
    Objects with _repr_jpeg_ should render as JPEG images.
    """

    class JPEGRepr:
        def _repr_jpeg_(self):
            # Minimal valid JPEG header (won't display but tests the path).
            return b"\xff\xd8\xff\xe0\x00\x10JFIF"

    display(JPEGRepr(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    assert img.src.startswith("data:image/jpeg;base64,")


async def test_repr_jpeg_base64():
    """
    _repr_jpeg_ can render a base64-encoded string.
    """

    class JPEGBase64:
        def _repr_jpeg_(self):
            return "ZCBqcGVnIG1pbmltdW0=="

    display(JPEGBase64(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    img = target.find("img")[0]
    assert img.src.startswith("data:image/jpeg;base64,")


async def test_object_with_no_repr_methods():
    """
    Objects with no representation methods should fall back to __repr__ with warning.
    """

    class NoReprMethods:
        pass

    obj = NoReprMethods()
    display(obj)
    container = await get_display_container()
    # Should contain the default repr output - the class name. :-)
    assert "NoReprMethods" in container.innerText


async def test_repr_method_returns_none():
    """
    If a repr method exists but returns None, try next method.
    """

    class NoneReturner:
        def _repr_html_(self):
            return None

        def __repr__(self):
            return "Fallback repr"

    display(NoneReturner())
    container = await get_display_container()
    assert container.innerText == "Fallback repr"


async def test_multiple_repr_methods_priority():
    """
    When multiple repr methods exist, should use first available in priority order.
    """

    class MultipleReprs:
        def _repr_html_(self):
            # Highest priority.
            return "<p>HTML version</p>"

        def __repr__(self):
            # Lower priority.
            return "Text version"

    display(MultipleReprs())
    container = await get_display_container()
    # Should use HTML, not repr.
    assert container[0].innerHTML == "<p>HTML version</p>"


async def test_empty_string_display():
    """
    Empty strings are ignored.
    """
    display("")
    container = await get_display_container()
    assert len(container.children) == 0


async def test_newline_string_skipped():
    """
    Single newline strings are skipped (legacy behavior).
    """
    display("\n")
    container = await get_display_container()
    # Should be empty because newlines are skipped.
    assert len(container.children) == 0


async def test_string_with_special_html_chars():
    """
    Strings with HTML special characters should be escaped.
    """
    display("<script>alert('xss')</script>")
    container = await get_display_container()
    assert "&lt;script&gt;" in container[0].innerHTML
    assert "<script>" not in container[0].innerHTML


async def test_javascript_mime_type():
    """
    JavaScript MIME type should create script tags.
    """

    class JSRepr:
        def _repr_javascript_(self):
            return "console.log('test');"

    display(JSRepr(), target="test-element-container", append=False)
    target = web.page.find("#test-element-container")[0]
    assert "<script>" in target.innerHTML
    assert "console.log" in target.innerHTML


async def test_append_false_clears_multiple_children():
    """
    append=False should clear all existing children, not just the last one.
    """
    # Add some initial content.
    display("child 1")
    display("child 2")
    display("child 3")
    container = await get_display_container()
    assert len(container.children) == 3  # three divs.

    # Now display with append=False.
    display("new content", append=False)
    container = await get_display_container()
    # No divs used, just the new textual content.
    assert container.innerText == "new content"


async def test_mixed_append_true_false():
    """
    Mixing append=True and append=False should work correctly.
    """
    display("first", append=True)
    display("second", append=True)
    display("third", append=False)
    container = await get_display_container()
    assert container.innerText == "third"


def test_target_with_multiple_hashes():
    """
    Target with multiple # characters should only strip the first one.

    Such an id is not valid in HTML, but we should handle it gracefully.
    """
    # Should try to find element with id="#weird-id".
    # This will raise ValueError as it doesn't exist.
    with upytest.raises(ValueError):
        display("content", target="##weird-id")


async def test_display_none_value():
    """
    Displaying None should use its repr.
    """
    display(None)
    container = await get_display_container()
    assert container.innerText == "None"


async def test_display_boolean_values():
    """
    Booleans should display as their repr.
    """
    display(True, False)
    container = await get_display_container()
    assert "True" in container.innerText
    assert "False" in container.innerText


async def test_display_numbers():
    """
    Numbers should display correctly.
    """
    display(42, 3.14159, -17)
    container = await get_display_container()
    text = container.innerText
    assert "42" in text
    assert "3.14159" in text
    assert "-17" in text
