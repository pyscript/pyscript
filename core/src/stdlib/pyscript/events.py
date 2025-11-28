"""
Event handling for PyScript.

This module provides two complementary systems:

1. The `Event` class: A simple publish-subscribe pattern for custom events
   within your Python code.

2. The `@when` decorator: Connects Python functions to browser DOM events,
   or instances of the `Event` class, allowing you to respond to user
   interactions like clicks, key presses and form submissions, or to custom
   events defined in your Python code.
"""

import asyncio
import inspect
from functools import wraps
from pyscript.magic_js import document
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

    # Trigger the event.
    data_loaded.trigger("My data")
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


def when(target, *args, **kwargs):
    """
    Add an event listener to the target element(s) for the specified event type.

    The target can be a string representing the event type, or an Event object.
    If the target is an Event object, the event listener will be added to that
    object. If the target is a string, the event listener will be added to the
    element(s) that match the (second) selector argument.

    If a (third) handler argument is provided, it will be called when the event
    is triggered; thus allowing this to be used as both a function and a
    decorator.
    """
    # If "when" is called as a function, try to grab the handler from the
    # arguments. If there's no handler, this must be a decorator based call.
    handler = None
    if args and (callable(args[0]) or is_awaitable(args[0])):
        handler = args[0]
    elif callable(kwargs.get("handler")) or is_awaitable(kwargs.get("handler")):
        handler = kwargs.pop("handler")
    # If the target is a string, it is the "older" use of `when` where it
    # represents the name of a DOM event.
    if isinstance(target, str):
        # Extract the selector from the arguments or keyword arguments.
        selector = args[0] if args else kwargs.pop("selector")
        if not selector:
            msg = "No selector provided."
            raise ValueError(msg)
        # Grab the DOM elements to which the target event will be attached.
        from pyscript.web import Element, ElementCollection

        if isinstance(selector, str):
            elements = document.querySelectorAll(selector)
        elif isinstance(selector, Element):
            elements = [selector._dom_element]
        elif isinstance(selector, ElementCollection):
            elements = [el._dom_element for el in selector]
        else:
            elements = selector if isinstance(selector, list) else [selector]

    def decorator(func):
        sig = inspect.signature(func)
        if sig.parameters:
            if is_awaitable(func):

                async def wrapper(event):
                    return await func(event)

            else:
                wrapper = func
        else:
            # Function doesn't receive events.
            if is_awaitable(func):

                async def wrapper(*args, **kwargs):
                    return await func()

            else:

                def wrapper(*args, **kwargs):
                    return func()

        wrapper = wraps(func)(wrapper)
        if isinstance(target, Event):
            # The target is a single Event object.
            target.add_listener(wrapper)
        elif isinstance(target, list) and all(isinstance(t, Event) for t in target):
            # The target is a list of Event objects.
            for evt in target:
                evt.add_listener(wrapper)
        else:
            # The target is a string representing an event type, and so a
            # DOM element or collection of elements is found in "elements".
            for el in elements:
                el.addEventListener(target, create_proxy(wrapper))
        return wrapper

    # If "when" was called as a decorator, return the decorator function,
    # otherwise just call the internal decorator function with the supplied
    # handler.
    return decorator(handler) if handler else decorator
