import inspect

import js
from pyodide.ffi.wrappers import add_event_listener


def when(event=None, id=None):
    """
    Decorates a function and passes py-* events to the decorated function
    The events might or not be an argument of the decorated function
    """

    def decorator(func):
        element = js.document.getElementById(id)
        sig = inspect.signature(func)
        # Function doesn't receive events
        if not sig.parameters:

            def wrapper(*args, **kwargs):
                func()

            add_event_listener(element, event, wrapper)
        else:
            add_event_listener(element, event, func)
        return func

    return decorator
