"""
Tests for the pyscript.when decorator.
"""

import upytest
from pyscript import web, RUNNING_IN_WORKER


def get_container():
    return web.page.find("#test-element-container")[0]


def setup():
    container = get_container()
    container.innerHTML = ""


def teardown():
    container = get_container()
    container.innerHTML = ""


async def test_when_decorator_with_event():
    """
    When the decorated function takes a single parameter,
    it should be passed the event object
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False

    @web.when("click", selector="#foo_id")
    def foo(evt):
        nonlocal called
        called = evt

    btn.click()
    assert called.target.id == "foo_id"


async def test_when_decorator_without_event():
    """
    When the decorated function takes no parameters (not including 'self'),
    it should be called without the event object
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False

    @web.when("click", selector="#foo_id")
    def foo():
        nonlocal called
        called = True

    btn.click()
    assert called


async def test_two_when_decorators():
    """
    When decorating a function twice, both should function
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called1 = False
    called2 = False

    @web.when("click", selector="#foo_id")
    def foo1(evt):
        nonlocal called1
        called1 = True

    @web.when("click", selector="#foo_id")
    def foo2(evt):
        nonlocal called2
        called2 = True

    btn.click()
    assert called1
    assert called2


async def test_two_when_decorators_same_element():
    """
    When decorating a function twice *on the same DOM element*, both should
    function
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    counter = 0

    @web.when("click", selector="#foo_id")
    @web.when("click", selector="#foo_id")
    def foo(evt):
        nonlocal counter
        counter += 1

    assert counter == 0, counter
    btn.click()
    assert counter == 2, counter


async def test_when_decorator_multiple_elements():
    """
    The @when decorator's selector should successfully select multiple
    DOM elements
    """
    btn1 = web.button(
        "foo_button1",
        id="foo_id1",
        classes=[
            "foo_class",
        ],
    )
    btn2 = web.button(
        "foo_button2",
        id="foo_id2",
        classes=[
            "foo_class",
        ],
    )
    container = get_container()
    container.append(btn1)
    container.append(btn2)

    counter = 0

    @web.when("click", selector=".foo_class")
    def foo(evt):
        nonlocal counter
        counter += 1

    assert counter == 0, counter
    btn1.click()
    assert counter == 1, counter
    btn2.click()
    assert counter == 2, counter


async def test_when_decorator_duplicate_selectors():
    """
    When is not idempotent, so it should be possible to add multiple
    @when decorators with the same selector.
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    counter = 0

    @web.when("click", selector="#foo_id")
    @web.when("click", selector="#foo_id")  # duplicate
    def foo1(evt):
        nonlocal counter
        counter += 1

    assert counter == 0, counter
    btn.click()
    assert counter == 2, counter


@upytest.skip(
    "Only works in Pyodide on main thread",
    skip_when=upytest.is_micropython or RUNNING_IN_WORKER,
)
def test_when_decorator_invalid_selector():
    """
    When the selector parameter of @when is invalid, it should raise an error.
    """
    if upytest.is_micropython:
        from jsffi import JsException
    else:
        from pyodide.ffi import JsException

    with upytest.raises(JsException) as e:

        @web.when("click", selector="#.bad")
        def foo(evt): ...

    assert "'#.bad' is not a valid selector" in str(e.exception), str(
        e.exception
    )
