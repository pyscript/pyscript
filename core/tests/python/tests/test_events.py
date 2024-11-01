"""
Tests for the when function and Event class.
"""

import asyncio

import upytest
from pyscript import RUNNING_IN_WORKER, web, Event, when


def get_container():
    return web.page.find("#test-element-container")[0]


def setup():
    container = get_container()
    container.innerHTML = ""


def teardown():
    container = get_container()
    container.innerHTML = ""


def test_event_add_listener():
    """
    Adding a listener to an event should add it to the list of listeners. It
    should only be added once.
    """
    event = Event()
    listener = lambda x: x
    event.add_listener(listener)
    event.add_listener(listener)
    assert len(event._listeners) == 1  # Only one item added.
    assert listener in event._listeners  # The item is the expected listener.


def test_event_remove_listener():
    """
    Removing a listener from an event should remove it from the list of
    listeners.
    """
    event = Event()
    listener1 = lambda x: x
    listener2 = lambda x: x
    event.add_listener(listener1)
    event.add_listener(listener2)
    assert len(event._listeners) == 2  # Two listeners added.
    assert listener1 in event._listeners  # The first listener is in the list.
    assert listener2 in event._listeners  # The second listener is in the list.
    event.remove_listener(listener1)
    assert len(event._listeners) == 1  # Only one item remains.
    assert listener2 in event._listeners  # The second listener is in the list.


def test_event_remove_all_listeners():
    """
    Removing all listeners from an event should clear the list of listeners.
    """
    event = Event()
    listener1 = lambda x: x
    listener2 = lambda x: x
    event.add_listener(listener1)
    event.add_listener(listener2)
    assert len(event._listeners) == 2  # Two listeners added.
    event.remove_listener()
    assert len(event._listeners) == 0  # No listeners remain.


def test_event_trigger():
    """
    Triggering an event should call all of the listeners with the provided
    arguments.
    """
    event = Event()
    counter = 0

    def listener(x):
        nonlocal counter
        counter += 1
        assert x == "ok"

    event.add_listener(listener)
    assert counter == 0  # The listener has not been triggered yet.
    event.trigger("ok")
    assert counter == 1  # The listener has been triggered with the expected result.


async def test_event_trigger_with_awaitable():
    """
    Triggering an event with an awaitable listener should call the listener
    with the provided arguments.
    """
    call_flag = asyncio.Event()
    event = Event()
    counter = 0

    async def listener(x):
        nonlocal counter
        counter += 1
        assert x == "ok"
        call_flag.set()

    event.add_listener(listener)
    assert counter == 0  # The listener has not been triggered yet.
    event.trigger("ok")
    await call_flag.wait()
    assert counter == 1  # The listener has been triggered with the expected result.


async def test_when_decorator_with_event():
    """
    When the decorated function takes a single parameter,
    it should be passed the event object.
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False
    call_flag = asyncio.Event()

    @when("click", selector="#foo_id")
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
    it should be called without the event object.
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
    assert called is True


async def test_when_decorator_with_event_as_async_handler():
    """
    When the decorated function takes a single parameter,
    it should be passed the event object. Async version.
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False
    call_flag = asyncio.Event()

    @when("click", selector="#foo_id")
    async def foo(evt):
        nonlocal called
        called = evt
        call_flag.set()

    btn.click()
    await call_flag.wait()
    assert called.target.id == "foo_id"


async def test_when_decorator_without_event_as_async_handler():
    """
    When the decorated function takes no parameters (not including 'self'),
    it should be called without the event object. Async version.
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False
    call_flag = asyncio.Event()

    @web.when("click", selector="#foo_id")
    async def foo():
        nonlocal called
        called = True
        call_flag.set()

    btn.click()
    await call_flag.wait()
    assert called is True


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

    @when("click", selector="#foo_id")
    def foo1(evt):
        nonlocal called1
        called1 = True
        call_flag1.set()

    @when("click", selector="#foo_id")
    def foo2(evt):
        nonlocal called2
        called2 = True
        call_flag2.set()

    btn.click()
    await call_flag1.wait()
    await call_flag2.wait()
    assert called1
    assert called2


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

    @when("click", selector=".foo_class")
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

        @when("click", selector="#.bad")
        def foo(evt): ...

    assert "'#.bad' is not a valid selector" in str(e.exception), str(e.exception)


def test_when_decorates_an_event():
    """
    When the @when decorator is used on a function to handle an Event instance,
    the function should be called when the Event object is triggered.
    """

    whenable = Event()
    counter = 0

    # When as a decorator.
    @when(whenable)
    def handler(result):
        """
        A function that should be called when the whenable object is triggered.

        The result generated by the whenable object should be passed to the
        function.
        """
        nonlocal counter
        counter += 1
        assert result == "ok"

    # The function should not be called until the whenable object is triggered.
    assert counter == 0
    # Trigger the whenable object.
    whenable.trigger("ok")
    # The function should have been called when the whenable object was
    # triggered.
    assert counter == 1


def test_when_called_with_an_event_and_handler():
    """
    The when function should be able to be called with an Event object,
    and a handler function.
    """
    whenable = Event()
    counter = 0

    def handler(result):
        """
        A function that should be called when the whenable object is triggered.

        The result generated by the whenable object should be passed to the
        function.
        """
        nonlocal counter
        counter += 1
        assert result == "ok"

    # When as a function.
    when(whenable, handler)

    # The function should not be called until the whenable object is triggered.
    assert counter == 0
    # Trigger the whenable object.
    whenable.trigger("ok")
    # The function should have been called when the whenable object was
    # triggered.
    assert counter == 1
