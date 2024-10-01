"""
Tests for the display function in PyScript.
"""

import asyncio

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
    assert str(exc.exception) == "Cannot have an empty target"


def test_non_string_target_values_raise_typerror():
    """
    The target parameter must be a string.
    """
    with upytest.raises(TypeError) as exc:
        display("hello world", target=True)
    assert str(exc.exception) == "target must be str or None, not bool"

    with upytest.raises(TypeError) as exc:
        display("hello world", target=123)
    assert str(exc.exception) == "target must be str or None, not int"


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
    mpl = await py_import("matplotlib")
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
    assert img.src.startswith("data:image/png;charset=utf-8;base64")
