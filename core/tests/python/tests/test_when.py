"""
Tests for the pyscript.when decorator.
"""

import asyncio

import upytest
from pyscript import RUNNING_IN_WORKER, web


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
    call_flag = asyncio.Event()

    @web.when("click", selector="#foo_id")
    def foo(evt):
        nonlocal called
        called = evt
        call_flag.set()

    btn.click()
    await call_flag.wait()
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
    call_flag = asyncio.Event()

    @web.when("click", selector="#foo_id")
    def foo():
        nonlocal called
        called = True
        call_flag.set()

    btn.click()
    await call_flag.wait()
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
    call_flag1 = asyncio.Event()
    call_flag2 = asyncio.Event()

    @web.when("click", selector="#foo_id")
    def foo1(evt):
        nonlocal called1
        called1 = True
        call_flag1.set()

    @web.when("click", selector="#foo_id")
    def foo2(evt):
        nonlocal called2
        called2 = True
        call_flag2.set()

    btn.click()
    await call_flag1.wait()
    await call_flag2.wait()
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
    call_flag = asyncio.Event()

    @web.when("click", selector="#foo_id")
    @web.when("click", selector="#foo_id")
    def foo(evt):
        nonlocal counter
        counter += 1
        call_flag.set()

    assert counter == 0, counter
    btn.click()
    await call_flag.wait()
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
    call_flag1 = asyncio.Event()
    call_flag2 = asyncio.Event()

    @web.when("click", selector=".foo_class")
    def foo(evt):
        nonlocal counter
        counter += 1
        if evt.target.id == "foo_id1":
            call_flag1.set()
        else:
            call_flag2.set()

    assert counter == 0, counter
    btn1.click()
    await call_flag1.wait()
    assert counter == 1, counter
    btn2.click()
    await call_flag2.wait()
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
    call_flag = asyncio.Event()

    @web.when("click", selector="#foo_id")
    @web.when("click", selector="#foo_id")  # duplicate
    def foo1(evt):
        nonlocal counter
        counter += 1
        call_flag.set()

    assert counter == 0, counter
    btn.click()
    await call_flag.wait()
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

    assert "'#.bad' is not a valid selector" in str(e.exception), str(e.exception)


def test_when_decorates_a_whenable():
    """
    When the @when decorator is used on a function to handle a whenable object,
    the function should be called when the whenable object is triggered.
    """

    class MyWhenable:
        """
        A simple whenable object that can be triggered.
        """

        def __init__(self):
            self.handler = None
            self.args = None
            self.kwargs = None
        
        def trigger(self):
            """
            Triggers the whenable object, resulting in the handler being
            called.
            """
            if self.handler:
                result = {
                    "args": self.args,
                    "kwargs": self.kwargs,
                }
                self.handler(result) # call the handler

        def __when__(self, handler, *args, **kwargs):
            """
            These implementation details depend on the sort of thing the
            whenable object represents. This is just a simple example.
            """
            self.handler = handler
            self.args = args
            self.kwargs = kwargs

    whenable = MyWhenable()
    counter = 0

    # When as a decorator.
    @web.when(whenable, "foo", "bar", baz="qux")
    def foo(result):
        """
        A function that should be called when the whenable object is triggered.

        The result generated by the whenable object should be passed to the
        function.
        """
        nonlocal counter
        counter += 1
        assert result["args"] == ("foo", "bar")
        assert result["kwargs"] == {"baz": "qux"}
    
    # The function should not be called until the whenable object is triggered.
    assert counter == 0
    # Trigger the whenable object.
    whenable.trigger()
    # The function should have been called when the whenable object was
    # triggered.
    assert counter == 1


def test_when_called_with_a_whenable():
    """
    The when function should be able to be called with a whenable object,
    a handler function, and arguments.
    """

    class MyWhenable:
        """
        A simple whenable object that can be triggered.
        """

        def __init__(self):
            self.handler = None
            self.args = None
            self.kwargs = None
        
        def trigger(self):
            """
            Triggers the whenable object, resulting in the handler being
            called.
            """
            if self.handler:
                result = {
                    "args": self.args,
                    "kwargs": self.kwargs,
                }
                self.handler(result) # call the handler

        def __when__(self, handler, *args, **kwargs):
            """
            These implementation details depend on the sort of thing the
            whenable object represents. This is just a simple example.
            """
            self.handler = handler
            self.args = args
            self.kwargs = kwargs

    whenable = MyWhenable()
    counter = 0

    def handler(result):
        """
        A function that should be called when the whenable object is triggered.

        The result generated by the whenable object should be passed to the
        function.
        """
        nonlocal counter
        counter += 1
        assert result["args"] == ("foo", "bar")
        assert result["kwargs"] == {"baz": "qux"}
    
    # When as a function.
    web.when(whenable, handler, "foo", "bar", baz="qux")

    # The function should not be called until the whenable object is triggered.
    assert counter == 0
    # Trigger the whenable object.
    whenable.trigger()
    # The function should have been called when the whenable object was
    # triggered.
    assert counter == 1