"""
Event handling for PyScript.

This module provides two complementary systems:

1. The `Event` class: A simple publish-subscribe pattern for custom events
   within *your* Python code.

2. The `@when` decorator: Connects Python functions to browser DOM events,
   or instances of the `Event` class, allowing you to respond to user
   interactions like clicks, key presses and form submissions, or to custom
   events defined in your Python code.
"""

import asyncio
import inspect
from functools import wraps
from pyscript.context import document
from pyscript.ffi import create_proxy
from pyscript.util import is_awaitable


class Event:
    """
    A custom event that can notify multiple listeners when triggered.

    Use this class to create your own event system within Python code.
    Listeners can be either regular functions or async functions.

    ```python
    from pyscript.events import Event

    # Create a custom event.
    data_loaded = Event()

    # Add a listener.
    def on_data_loaded(result):
        print(f"Data loaded: {result}")

    data_loaded.add_listener(on_data_loaded)

    # Time passes.... trigger the event.
    data_loaded.trigger({"data": 123})
    ```
    """

    def __init__(self):
        self._listeners = []

    def trigger(self, result):
        """
        Trigger the event and notify all listeners with the given result.
        """
        for listener in self._listeners:
            if is_awaitable(listener):
                asyncio.create_task(listener(result))
            else:
                listener(result)

    def add_listener(self, listener):
        """
        Add a function to be called when this event is triggered.

        The listener must be callable. It can be either a regular function
        or an async function. Duplicate listeners are ignored.
        """
        if not callable(listener):
            msg = "Listener must be callable."
            raise ValueError(msg)
        if listener not in self._listeners:
            self._listeners.append(listener)

    def remove_listener(self, *listeners):
        """
        Remove specified listeners. If none specified, remove all listeners.
        """
        if listeners:
            for listener in listeners:
                try:
                    self._listeners.remove(listener)
                except ValueError:
                    pass  # Silently ignore listeners not in the list.
        else:
            self._listeners = []


def when(event_type, selector=None):
    """
    A decorator to handle DOM events or custom Event objects.

    For DOM events, specify the `event_type` (e.g. `"click"`) and a `selector`
    for target elements. For custom `Event` objects, just pass the `Event`
    instance as the `event_type`. It's also possible to pass a list of `Event`
    objects. The `selector` is required only for DOM events. It should be a
    CSS selector string, Element, ElementCollection, or list of DOM elements.

    The decorated function can be either a regular function or an async
    function. If the function accepts an argument, it will receive the event
    object (for DOM events) or the Event's result (for custom events). A
    function does not need to accept any arguments if it doesn't require them.

    ```python
    from pyscript import when, display

    # Handle DOM events.
    @when("click", "#my-button")
    def handle_click(event):
        display("Button clicked!")

    # Handle custom events.
    my_event = Event()

    @when(my_event)
    def handle_custom():  # No event argument needed.
        display("Custom event triggered!")

    # Handle multiple custom events.
    another_event = Event()

    def another_handler():
        display("Another custom event handler.")

    # Attach the same handler to multiple events but not as a decorator.
    when([my_event, another_event])(another_handler)

    # Trigger an Event instance from a DOM event via @when.
    @when("click", "#my-button")
    def handle_click(event):
        another_event.trigger("Button clicked!")

    # Stacked decorators also work.
    @when("mouseover", "#my-div")
    @when(my_event)
    def handle_both(event):
        display("Either mouseover or custom event triggered!")
    ```
    """
    if isinstance(event_type, str):
        # This is a DOM event to handle, so check and use the selector.
        if not selector:
            raise ValueError("Selector required for DOM event handling.")
        elements = _get_elements(selector)
        if not elements:
            raise ValueError(f"No elements found for selector: {selector}")

    def decorator(func):
        wrapper = _create_wrapper(func)
        if isinstance(event_type, Event):
            # Custom Event - add listener.
            event_type.add_listener(wrapper)
        elif isinstance(event_type, list) and all(
            isinstance(t, Event) for t in event_type
        ):
            # List of custom Events - add listener to each.
            for event in event_type:
                event.add_listener(wrapper)
        else:
            # DOM event - attach to all matched elements.
            for element in elements:
                element.addEventListener(event_type, create_proxy(wrapper))
        return wrapper

    return decorator


def _get_elements(selector):
    """
    Convert various selector types into a list of DOM elements.
    """
    from pyscript.web import Element, ElementCollection

    if isinstance(selector, str):
        return list(document.querySelectorAll(selector))
    elif isinstance(selector, Element):
        return [selector._dom_element]
    elif isinstance(selector, ElementCollection):
        return [el._dom_element for el in selector]
    elif isinstance(selector, list):
        return selector
    else:
        return [selector]


def _create_wrapper(func):
    """
    Create an appropriate wrapper for the given function.

    The wrapper handles both sync and async functions, and respects whether
    the function expects to receive event arguments.
    """
    # Get the original function if it's been wrapped. This avoids wrapper
    # loops when stacking decorators.
    original_func = func
    while hasattr(original_func, "__wrapped__"):
        original_func = original_func.__wrapped__
    # Inspect the original function signature.
    sig = inspect.signature(original_func)
    accepts_args = bool(sig.parameters)
    if is_awaitable(func):
        if accepts_args:

            async def wrapper(event):
                return await func(event)

        else:

            async def wrapper(*args, **kwargs):
                return await func()

    else:
        if accepts_args:
            # Always create a new wrapper function to avoid issues with
            # stacked decorators getting into an infinite loop.

            def wrapper(event):
                return func(event)

        else:

            def wrapper(*args, **kwargs):
                return func()

    return wraps(func)(wrapper)
