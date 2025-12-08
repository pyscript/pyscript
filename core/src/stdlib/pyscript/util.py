"""
This module contains general-purpose utility functions that don't fit into
more specific modules. These utilities handle cross-platform compatibility
between Pyodide and MicroPython, feature detection, and common type
conversions:

- `as_bytearray`: Convert JavaScript `ArrayBuffer` to Python `bytearray`.
- `NotSupported`: Placeholder for unavailable features in specific contexts.
- `is_awaitable`: Detect `async` functions across Python implementations.

These utilities are primarily used internally by PyScript but are available
for use in application code when needed.
"""

import js
import inspect


def as_bytearray(buffer):
    """
    Given a JavaScript `ArrayBuffer`, convert it to a Python `bytearray` in a
    MicroPython friendly manner.
    """
    ui8a = js.Uint8Array.new(buffer)
    size = ui8a.length
    ba = bytearray(size)
    for i in range(size):
        ba[i] = ui8a[i]
    return ba


class NotSupported:
    """
    Small helper that raises exceptions if you try to get/set any attribute on
    it.
    """

    def __init__(self, name, error):
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "error", error)

    def __repr__(self):
        return f"<NotSupported {self.name} [{self.error}]>"

    def __getattr__(self, attr):
        raise AttributeError(self.error)

    def __setattr__(self, attr, value):
        raise AttributeError(self.error)

    def __call__(self, *args):
        raise TypeError(self.error)


def is_awaitable(obj):
    """
    Returns a boolean indication if the passed in obj is an awaitable
    function. This is interpreter agnostic.

    !!! info
        MicroPython treats awaitables as generator functions, and if
        the object is a closure containing an async function or a bound method
        we need to work carefully.
    """
    from pyscript import config

    if config["type"] == "mpy":
        # MicroPython doesn't appear to have a way to determine if a closure is
        # an async function except via the repr. This is a bit hacky.
        r = repr(obj)
        if "<closure <generator>" in r:
            return True
        # Same applies to bound methods.
        if "<bound_method" in r and "<generator>" in r:
            return True
        # In MicroPython, generator functions are awaitable.
        return inspect.isgeneratorfunction(obj)

    return inspect.iscoroutinefunction(obj)
