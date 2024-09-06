import inspect

try:
    from pyodide.ffi.wrappers import add_event_listener

except ImportError:

    def add_event_listener(el, event_type, func):
        el.addEventListener(event_type, func)


from pyscript.magic_js import document


def when(event_type=None, selector=None):
    """
    Decorates a function and passes py-* events to the decorated function
    The events might or not be an argument of the decorated function
    """

    def decorator(func):

        from pyscript.web import Element, ElementCollection

        if isinstance(selector, str):
            elements = document.querySelectorAll(selector)
        # TODO: This is a hack that will be removed when pyscript becomes a package
        #       and we can better manage the imports without circular dependencies
        elif isinstance(selector, Element):
            elements = [selector._dom_element]
        elif isinstance(selector, ElementCollection):
            elements = [el._dom_element for el in selector]
        else:
            if isinstance(selector, list):
                elements = selector
            else:
                elements = [selector]

        try:
            sig = inspect.signature(func)
            # Function doesn't receive events
            if not sig.parameters:

                # Function is async: must be awaited
                if inspect.iscoroutinefunction(func):

                    async def wrapper(*args, **kwargs):
                        await func()

                else:

                    def wrapper(*args, **kwargs):
                        func()

            else:
                wrapper = func

        except AttributeError:
            # TODO: this is very ugly hack to get micropython working because inspect.signature
            #       doesn't exist, but we need to actually properly replace inspect.signature.
            #       It may be actually better to not try any magic for now and raise the error
            def wrapper(*args, **kwargs):
                try:
                    return func(*args, **kwargs)
                except TypeError as e:
                    if "takes" in str(e) and "positional arguments" in str(e):
                        return func()

                    raise

        for el in elements:
            add_event_listener(el, event_type, wrapper)

        return func

    return decorator
