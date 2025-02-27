import asyncio
import inspect
import sys

from functools import wraps
from pyscript.magic_js import document
from pyscript.ffi import create_proxy
from pyscript.util import is_awaitable
from pyscript import config


class Event:
    """
    Represents something that may happen at some point in the future.
    """

    def __init__(self):
        self._listeners = []

    def trigger(self, result):
        """
        Trigger the event with a result to pass into the handlers.
        """
        for listener in self._listeners:
            if is_awaitable(listener):
                # Use create task to avoid making this an async function.
                asyncio.create_task(listener(result))
            else:
                listener(result)

    def add_listener(self, listener):
        """
        Add a callable/awaitable to listen to when this event is triggered.
        """
        if is_awaitable(listener) or callable(listener):
            if listener not in self._listeners:
                self._listeners.append(listener)
        else:
            msg = "Listener must be callable or awaitable."
            raise ValueError(msg)

    def remove_listener(self, *args):
        """
        Clear the specified handler functions in *args. If no handlers
        provided, clear all handlers.
        """
        if args:
            for listener in args:
                self._listeners.remove(listener)
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
        if config["type"] == "mpy":  # Is MicroPython?
            if is_awaitable(func):

                async def wrapper(*args, **kwargs):
                    """
                    This is  a very ugly hack to get micropython working because
                    `inspect.signature` doesn't exist. It may be actually better
                    to not try any magic for now and raise the error.
                    """
                    try:
                        return await func(*args, **kwargs)

                    except TypeError as e:
                        if "takes" in str(e) and "positional arguments" in str(e):
                            return await func()
                        raise

            else:

                def wrapper(*args, **kwargs):
                    """
                    This is  a very ugly hack to get micropython working because
                    `inspect.signature` doesn't exist. It may be actually better
                    to not try any magic for now and raise the error.
                    """
                    try:
                        return func(*args, **kwargs)

                    except TypeError as e:
                        if "takes" in str(e) and "positional arguments" in str(e):
                            return func()
                        raise

        else:
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
