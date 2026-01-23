"""
This module provides a unified
[Foreign Function Interface (FFI)](https://en.wikipedia.org/wiki/Foreign_function_interface)
layer for Python/JavaScript interactions, that works consistently across both
Pyodide and MicroPython, and in a worker or main thread context, abstracting
away the differences in their JavaScript interop APIs.

The following utilities work on both the main thread and in worker contexts:

- `create_proxy`: Create a persistent JavaScript proxy of a Python function.
- `to_js`: Convert Python objects to JavaScript objects.
- `is_none`: Check if a value is Python `None` or JavaScript `null`.
- `assign`: Merge objects (like JavaScript's `Object.assign`).

The following utilities are specific to worker contexts:

- `direct`: Mark objects for direct JavaScript access.
- `gather`: Collect multiple values from worker contexts.
- `query`: Query objects in worker contexts.

More details of the `direct`, `gather`, and `query` utilities
[can be found here](https://github.com/WebReflection/reflected-ffi?tab=readme-ov-file#remote-extra-utilities).
"""

try:
    # Attempt to import Pyodide's FFI utilities.
    import js
    from pyodide.ffi import create_proxy as _cp
    from pyodide.ffi import to_js as _py_tjs
    from pyodide.ffi import jsnull

    from_entries = js.Object.fromEntries

    def _to_js_wrapper(value, **kw):
        if "dict_converter" not in kw:
            kw["dict_converter"] = from_entries
        return _py_tjs(value, **kw)

except:
    # Fallback to jsffi for MicroPython.
    from jsffi import create_proxy as _cp
    from jsffi import to_js as _to_js_wrapper
    import js

    jsnull = js.Object.getPrototypeOf(js.Object.prototype)


def create_proxy(func):
    """
    Create a persistent JavaScript proxy of a Python function.

    This proxy allows JavaScript code to call the Python function
    seamlessly, maintaining the correct context and argument handling.

    This is especially useful when passing Python functions as callbacks
    to JavaScript APIs (without `create_proxy`, the function would be
    garbage collected after the declaration of the callback).

    ```python
    from pyscript import ffi
    from pyscript import document

    my_button = document.getElementById("my-button")

    def py_callback(x):
        print(f"Callback called with {x}")

    my_button.addEventListener("click", ffi.create_proxy(py_callback))
    ```
    """
    return _cp(func)


def to_js(value, **kw):
    """
    Convert Python objects to JavaScript objects.

    This ensures a Python `dict` becomes a
    [proper JavaScript object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
    rather a JavaScript [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map),
    which is more intuitive for most use cases.

    Where required, the underlying `to_js` uses `Object.fromEntries` for
    `dict` conversion.

    ```python
    from pyscript import ffi
    import js


    note = {
        "body": "This is a notification",
        "icon": "icon.png"
    }

    js.Notification.new("Hello!", ffi.to_js(note))
    ```
    """
    return _to_js_wrapper(value, **kw)


def is_none(value):
    """
    Check if a value is `None` or JavaScript `null`.

    In Pyodide, JavaScript `null` is represented by the `jsnull` object,
    so we check for both Python `None` and `jsnull`. This function ensures
    consistent behavior across Pyodide and MicroPython for null-like
    values.

    ```python
    from pyscript import ffi
    import js


    val1 = None
    val2 = js.null
    val3 = 42

    print(ffi.is_none(val1))  # True
    print(ffi.is_none(val2))  # True
    print(ffi.is_none(val3))  # False
    ```
    """
    return value is None or value is jsnull


try:
    # Worker context utilities from reflected-ffi.
    # See https://github.com/WebReflection/reflected-ffi for more details.
    from polyscript import ffi as _ffi

    _assign = _ffi.assign

    direct = _ffi.direct
    gather = _ffi.gather
    query = _ffi.query

except:
    # Fallback implementations for main thread context.
    import js

    _assign = js.Object.assign

    direct = lambda source: source


def assign(source, *args):
    """
    Merge JavaScript objects (like
    [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)).

    Takes a target object and merges properties from one or more source
    objects into it, returning the modified target.

    ```python
    obj = js.Object.new()
    ffi.assign(obj, {"a": 1}, {"b": 2})
    # obj now has properties a=1 and b=2
    ```
    """
    for arg in args:
        _assign(source, to_js(arg))
    return source
