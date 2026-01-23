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
    Adding a listener to an event should add it to the list of listeners.
    It should only be added once.
    """
    event = Event()
    listener = lambda x: x
    event.add_listener(listener)
    event.add_listener(listener)
    assert len(event._listeners) == 1
    assert listener in event._listeners


def test_event_add_non_callable_listener():
    """
    Adding a non-callable listener should raise a ValueError.
    """
    event = Event()
    with upytest.raises(ValueError):
        event.add_listener("not a callable")
    with upytest.raises(ValueError):
        event.add_listener(123)


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
    assert len(event._listeners) == 2
    assert listener1 in event._listeners
    assert listener2 in event._listeners
    event.remove_listener(listener1)
    assert len(event._listeners) == 1
    assert listener2 in event._listeners


def test_event_remove_nonexistent_listener():
    """
    Removing a listener that doesn't exist should be silently ignored.
    """
    event = Event()
    listener1 = lambda x: x
    listener2 = lambda x: x
    event.add_listener(listener1)
    event.remove_listener(listener2)
    assert len(event._listeners) == 1
    assert listener1 in event._listeners


def test_event_remove_all_listeners():
    """
    Removing all listeners from an event should clear the list of listeners.
    """
    event = Event()
    listener1 = lambda x: x
    listener2 = lambda x: x
    event.add_listener(listener1)
    event.add_listener(listener2)
    assert len(event._listeners) == 2
    event.remove_listener()
    assert len(event._listeners) == 0


def test_event_trigger():
    """
    Triggering an event should call all of the listeners with the provided
    result.
    """
    event = Event()
    counter = 0

    def listener(x):
        nonlocal counter
        counter += 1
        assert x == "ok"

    event.add_listener(listener)
    assert counter == 0
    event.trigger("ok")
    assert counter == 1


def test_event_trigger_no_listeners():
    """
    Triggering an event with no listeners should not raise an error.
    """
    event = Event()
    event.trigger("test")


def test_event_trigger_multiple_listeners():
    """
    Triggering an event should call all registered listeners.
    """
    event = Event()
    results = []

    def listener1(x):
        results.append(f"listener1: {x}")

    def listener2(x):
        results.append(f"listener2: {x}")

    event.add_listener(listener1)
    event.add_listener(listener2)
    event.trigger("test")

    assert len(results) == 2
    assert "listener1: test" in results
    assert "listener2: test" in results


async def test_event_trigger_with_awaitable():
    """
    Triggering an event with an awaitable listener should call the listener
    with the provided result.
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
    assert counter == 0
    event.trigger("ok")
    await call_flag.wait()
    assert counter == 1


async def test_event_trigger_mixed_listeners():
    """
    Triggering an event with both sync and async listeners should work.
    """
    event = Event()
    sync_called = False
    async_flag = asyncio.Event()

    def sync_listener(x):
        nonlocal sync_called
        sync_called = True
        assert x == "mixed"

    async def async_listener(x):
        assert x == "mixed"
        async_flag.set()

    event.add_listener(sync_listener)
    event.add_listener(async_listener)
    event.trigger("mixed")

    assert sync_called
    await async_flag.wait()


def test_event_listener_exception():
    """
    If a listener raises an exception, it should propagate and not be
    silently ignored.
    """
    event = Event()

    def bad_listener(x):
        raise RuntimeError("Listener error")

    event.add_listener(bad_listener)

    with upytest.raises(RuntimeError):
        event.trigger("test")


def test_event_listener_exception_stops_other_listeners():
    """
    If a listener raises an exception, subsequent listeners should not be
    called. There's a problem with the user's code that needs to be addressed!
    """
    event = Event()
    called = []

    def listener1(x):
        called.append("listener1")

    def bad_listener(x):
        called.append("bad_listener")
        raise RuntimeError("Listener error")

    def listener3(x):
        called.append("listener3")

    event.add_listener(listener1)
    event.add_listener(bad_listener)
    event.add_listener(listener3)

    with upytest.raises(RuntimeError):
        event.trigger("test")

    assert "listener1" in called
    assert "bad_listener" in called
    assert "listener3" not in called


async def test_event_async_listener_exception():
    """
    If an async listener raises an exception, it cannot prevent other
    listeners from being called, as async listeners run as tasks. This
    is different behavior from sync listeners, but the simplest model
    for users to understand.

    This test ensures that even if one async listener fails, others
    still run as per this expected behaviour. In MicroPython, the
    exception will be reported to the user.
    """
    event = Event()
    call_flag = asyncio.Event()
    called = []

    async def bad_listener(x):
        called.append("bad_listener")
        raise RuntimeError("Async listener error")

    async def good_listener(x):
        called.append("good_listener")
        call_flag.set()

    event.add_listener(bad_listener)
    event.add_listener(good_listener)
    event.trigger("test")

    await call_flag.wait()
    assert "bad_listener" in called
    assert "good_listener" in called


async def test_when_decorator_with_event():
    """
    When the decorated function takes a single parameter, it should be
    passed the event object.
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
    When the decorated function takes no parameters, it should be called
    without the event object.
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False
    call_flag = asyncio.Event()

    @when("click", selector="#foo_id")
    def foo():
        nonlocal called
        called = True
        call_flag.set()

    btn.click()
    await call_flag.wait()
    assert called is True


async def test_when_decorator_with_event_as_async_handler():
    """
    When the decorated function takes a single parameter, it should be
    passed the event object. Async version.
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
    When the decorated function takes no parameters, it should be called
    without the event object. Async version.
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False
    call_flag = asyncio.Event()

    @when("click", selector="#foo_id")
    async def foo():
        nonlocal called
        called = True
        call_flag.set()

    btn.click()
    await call_flag.wait()
    assert called is True


async def test_two_when_decorators():
    """
    When decorating a function twice, both should function independently.
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
    DOM elements.
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
    When the selector parameter of @when is invalid, it should raise an
    error.
    """
    if upytest.is_micropython:
        from jsffi import JsException
    else:
        from pyodide.ffi import JsException

    with upytest.raises(JsException) as e:

        @when("click", selector="#.bad")
        def foo(evt): ...

    assert "'#.bad' is not a valid selector" in str(e.exception), str(e.exception)


def test_when_missing_selector_for_dom_event():
    """
    When using @when with a DOM event but no selector, should raise
    ValueError.
    """
    with upytest.raises(ValueError):

        @when("click")
        def handler(event):
            pass


def test_when_empty_selector_finds_no_elements():
    """
    When selector matches no elements, should raise ValueError.
    """
    with upytest.raises(ValueError):

        @when("click", "#nonexistent-element-id-12345")
        def handler(event):
            pass


def test_when_decorates_an_event():
    """
    When the @when decorator is used on a function to handle an Event
    instance, the function should be called when the Event object is
    triggered.
    """
    whenable = Event()
    counter = 0

    @when(whenable)
    def handler(result):
        """
        A function that should be called when the whenable object is
        triggered.
        """
        nonlocal counter
        counter += 1
        assert result == "ok"

    assert counter == 0
    whenable.trigger("ok")
    assert counter == 1


async def test_when_with_list_of_events():
    """
    The @when decorator should handle a list of Event objects.
    """
    event1 = Event()
    event2 = Event()
    counter = 0

    @when([event1, event2])
    def handler(result):
        nonlocal counter
        counter += 1

    assert counter == 0
    event1.trigger("test1")
    assert counter == 1
    event2.trigger("test2")
    assert counter == 2


async def test_when_with_async_event_handler():
    """
    Async handlers should work with custom Event objects.
    """
    event = Event()
    call_flag = asyncio.Event()
    counter = 0

    @when(event)
    async def handler(result):
        nonlocal counter
        counter += 1
        assert result == "async test"
        call_flag.set()

    assert counter == 0
    event.trigger("async test")
    await call_flag.wait()
    assert counter == 1


async def test_when_with_element_selector():
    """
    The @when decorator should accept an Element object as selector.
    """
    btn = web.button("test", id="elem_selector_test")
    container = get_container()
    container.append(btn)

    called = False
    call_flag = asyncio.Event()

    @when("click", btn)
    def handler(event):
        nonlocal called
        called = True
        call_flag.set()

    btn.click()
    await call_flag.wait()
    assert called


async def test_when_with_element_collection_selector():
    """
    The @when decorator should accept an ElementCollection as selector.
    """
    btn1 = web.button("btn1", id="col_test_1", classes=["test-class"])
    btn2 = web.button("btn2", id="col_test_2", classes=["test-class"])
    container = get_container()
    container.append(btn1)
    container.append(btn2)

    collection = web.page.find(".test-class")
    counter = 0
    call_flag = asyncio.Event()

    @when("click", collection)
    def handler(event):
        nonlocal counter
        counter += 1
        if counter == 2:
            call_flag.set()

    btn1.click()
    btn2.click()
    await call_flag.wait()
    assert counter == 2


async def test_when_with_list_of_elements():
    """
    The @when decorator should accept a list of DOM elements as selector.
    """
    btn1 = web.button("btn1", id="list_test_1")
    btn2 = web.button("btn2", id="list_test_2")
    container = get_container()
    container.append(btn1)
    container.append(btn2)

    elements = [btn1._dom_element, btn2._dom_element]
    counter = 0
    call_flag = asyncio.Event()

    @when("click", elements)
    def handler(event):
        nonlocal counter
        counter += 1
        if counter == 2:
            call_flag.set()

    btn1.click()
    btn2.click()
    await call_flag.wait()
    assert counter == 2


def test_when_decorator_returns_wrapper():
    """
    The @when decorator should return the wrapped function.
    """
    event = Event()

    @when(event)
    def handler(result):
        return result

    assert callable(handler)


def test_when_multiple_events_on_same_handler():
    """
    Multiple @when decorators can be stacked on the same function.
    """
    event1 = Event()
    event2 = Event()
    counter = 0

    @when(event1)
    @when(event2)
    def handler(result):
        nonlocal counter
        counter += 1

    assert counter == 0
    event1.trigger("test")
    assert counter == 1
    event2.trigger("test")
    assert counter == 2


async def test_when_on_different_callables():
    """
    The @when decorator works with various callable types.
    """
    results = []

    def func(x):
        results.append("func")

    async def a_func(x):
        results.append("a_func")

    def make_inner_func():
        def inner_func(x):
            results.append("inner_func")

        return inner_func

    def make_inner_a_func():
        async def inner_a_func(x):
            results.append("inner_a_func")

        return inner_a_func

    def make_closure():
        a = 1

        def closure_func(x):
            results.append(f"closure_func:{a}")

        return closure_func

    def make_a_closure():
        a = 1

        async def closure_a_func(x):
            results.append(f"closure_a_func:{a}")

        return closure_a_func

    inner_func = make_inner_func()
    inner_a_func = make_inner_a_func()
    cl_func = make_closure()
    cl_a_func = make_a_closure()

    whenable = Event()

    # Each of these should work with the @when decorator.
    when(whenable)(func)
    when(whenable)(a_func)
    when(whenable)(inner_func)
    when(whenable)(inner_a_func)
    when(whenable)(cl_func)
    when(whenable)(cl_a_func)

    # Verify no handlers have been called yet.
    assert len(results) == 0

    # Trigger the event.
    whenable.trigger("test")

    # Wait for async handlers to complete.
    await asyncio.sleep(0.1)

    # Verify all handlers were called.
    assert len(results) == 6
    assert "func" in results
    assert "a_func" in results
    assert "inner_func" in results
    assert "inner_a_func" in results
    assert "closure_func:1" in results
    assert "closure_a_func:1" in results


async def test_when_dom_event_with_options():
    """
    Options should be passed to addEventListener for DOM events.
    """
    click_count = 0
    call_flag = asyncio.Event()

    @when("click", "#button-for-event-testing", once=True)
    def handle_click(event):
        nonlocal click_count
        click_count += 1
        call_flag.set()

    btn = web.page["#button-for-event-testing"]
    btn.click()
    await call_flag.wait()
    assert click_count == 1

    # Click again - should not increment due to once=True.
    btn.click()
    # Bit of a bodge - a brief wait to ensure no handler fires.
    await asyncio.sleep(0.01)
    assert click_count == 1


async def test_when_custom_event_options_ignored():
    """
    Options should be silently ignored for custom Event objects.
    """
    my_event = Event()
    trigger_count = 0
    call_flag = asyncio.Event()

    @when(my_event, once=True)
    def handler(result):
        nonlocal trigger_count
        trigger_count += 1
        if trigger_count == 2:
            call_flag.set()

    # Should trigger multiple times despite once=True being ignored.
    my_event.trigger("first")
    my_event.trigger("second")
    await call_flag.wait()
    assert trigger_count == 2
