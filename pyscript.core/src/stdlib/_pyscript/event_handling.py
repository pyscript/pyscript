import inspect

from pyodide.ffi.wrappers import add_event_listener
from pyscript import document


def when(event_type=None, selector=None):
    """
    Decorates a function and passes py-* events to the decorated function
    The events might or not be an argument of the decorated function
    """

    def decorator(func):
        if not isinstance(selector, str):
            if hasattr(selector, "id"):
                selector = "#" + selector.id  # noqa: F823

        elements = document.querySelectorAll(selector)
        sig = inspect.signature(func)
        # Function doesn't receive events
        if not sig.parameters:

            def wrapper(*args, **kwargs):
                func()

            for el in elements:
                add_event_listener(el, event_type, wrapper)
        else:
            for el in elements:
                add_event_listener(el, event_type, func)
        return func

    return decorator
