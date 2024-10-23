import inspect

try:
    from pyodide.ffi.wrappers import add_event_listener

except ImportError:

    def add_event_listener(el, event_type, func):
        el.addEventListener(event_type, func)


from pyscript.magic_js import document


def when(target, *args, **kwargs):
    """


    unwhen(whenable, handler)

    disconnect(whenable, handler)

    
    """   
    # If "when" is called as a function, try to grab the handler from the
    # arguments. If there's no handler, this must be a decorator based call.
    handler = None
    if args and callable(args[0]):
        handler = args[0]
        args = args[1:]
    elif callable(kwargs.get("handler")):
        handler = kwargs.pop("handler")

    # Does the target implement the when protocol?
    whenable = hasattr(target, "__when__")
    # If not when-able, the DOM selector for the target event.
    if not whenable:
        # The target is an event linked to a DOM selector. Extract the 
        # selector from the arguments or keyword arguments.
        if args:
            selector = args[0]
        elif kwargs:
            selector = kwargs.get("selector")
        if not selector:
            # There must be a selector if the target is not when-able.
            raise ValueError("No selector provided.")
        # Grab the DOM elements to which the target event will be attached.
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

    def decorator(func):
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

        if whenable:
            target.__when__(wrapper, *args, **kwargs)
        else:
            for el in elements:
                add_event_listener(el, target, wrapper)

        return func

    if handler:
        decorator(handler)
    else:
        return decorator
