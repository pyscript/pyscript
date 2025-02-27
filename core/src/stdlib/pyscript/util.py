import js
import sys
import inspect


def as_bytearray(buffer):
    """
    Given a JavaScript ArrayBuffer, convert it to a Python bytearray in a
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
    function. (MicroPython treats awaitables as generator functions, and if
    the object is a closure containing an async function we need to work
    carefully.)
    """
    from pyscript import config

    if config["type"] == "mpy":  # Is MicroPython?
        # MicroPython doesn't appear to have a way to determine if a closure is
        # an async function except via the repr. This is a bit hacky.
        if "<closure <generator>" in repr(obj):
            return True
        return inspect.isgeneratorfunction(obj)

    return inspect.iscoroutinefunction(obj)
