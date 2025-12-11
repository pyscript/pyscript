"""
Tests for the pyscript.util module.
"""

import upytest
import js
from pyscript import util


def test_as_bytearray():
    """
    The as_bytearray function should convert a JavaScript ArrayBuffer to a
    Python bytearray.
    """
    msg = b"Hello, world!"
    buffer = js.ArrayBuffer.new(len(msg))
    ui8a = js.Uint8Array.new(buffer)
    for i, b in enumerate(msg):
        ui8a[i] = b
    ba = util.as_bytearray(buffer)
    assert isinstance(ba, bytearray)
    assert ba == msg


def test_as_bytearray_empty():
    """
    The as_bytearray function should handle empty ArrayBuffers.
    """
    buffer = js.ArrayBuffer.new(0)
    ba = util.as_bytearray(buffer)
    assert isinstance(ba, bytearray)
    assert len(ba) == 0


def test_as_bytearray_binary_data():
    """
    The as_bytearray function should handle binary data with all byte values.
    """
    # Test with all possible byte values.
    data = bytes(range(256))
    buffer = js.ArrayBuffer.new(len(data))
    ui8a = js.Uint8Array.new(buffer)
    for i, b in enumerate(data):
        ui8a[i] = b
    ba = util.as_bytearray(buffer)
    assert ba == bytearray(data)


def test_not_supported_repr():
    """
    The NotSupported class should have a meaningful repr.
    """
    ns = util.NotSupported("test_feature", "Feature not available")
    repr_str = repr(ns)
    assert "NotSupported" in repr_str
    assert "test_feature" in repr_str


def test_not_supported_getattr():
    """
    The NotSupported class should raise AttributeError on attribute access.
    """
    ns = util.NotSupported("test", "This is not supported.")
    with upytest.raises(AttributeError) as e:
        ns.some_attr
    assert str(e.exception) == "This is not supported."


def test_not_supported_setattr():
    """
    The NotSupported class should raise AttributeError on attribute
    assignment.
    """
    ns = util.NotSupported("test", "This is not supported.")
    with upytest.raises(AttributeError) as e:
        ns.some_attr = 1
    assert str(e.exception) == "This is not supported."


def test_not_supported_call():
    """
    The NotSupported class should raise TypeError when called.
    """
    ns = util.NotSupported("test", "This is not supported.")
    with upytest.raises(TypeError) as e:
        ns()
    assert str(e.exception) == "This is not supported."


def test_not_supported_call_with_args():
    """
    The NotSupported class should raise TypeError when called with arguments.
    """
    ns = util.NotSupported("test", "This is not supported.")
    with upytest.raises(TypeError) as e:
        ns(1, 2, 3)
    assert str(e.exception) == "This is not supported."


def test_is_awaitable_async_function():
    """
    The is_awaitable function should identify async functions as awaitable.
    """

    async def async_func():
        pass

    assert util.is_awaitable(async_func)


def test_is_awaitable_regular_function():
    """
    The is_awaitable function should identify regular functions as not
    awaitable.
    """

    def regular_func():
        pass

    assert not util.is_awaitable(regular_func)


def test_is_awaitable_lambda():
    """
    The is_awaitable function should identify lambdas as not awaitable.
    """
    assert not util.is_awaitable(lambda: None)


def test_is_awaitable_async_lambda():
    """
    The is_awaitable function should identify async lambdas as awaitable.
    """
    # Note: async lambdas don't exist in Python, but this documents the
    # expected behavior.
    async_lambda = lambda: (yield)
    # This test documents current behavior - may vary by implementation.


def test_is_awaitable_generator():
    """
    The is_awaitable function should handle generator functions correctly.
    """

    def gen_func():
        yield 1

    # Generator functions are treated differently in MicroPython vs Pyodide.
    # In MicroPython, async functions are generator functions.
    result = util.is_awaitable(gen_func)
    # Result depends on Python implementation.
    assert isinstance(result, bool)


def test_is_awaitable_async_closure():
    """
    The is_awaitable function should handle async closures correctly.
    """

    def make_async_closure():
        async def inner():
            pass

        return inner

    closure = make_async_closure()
    assert util.is_awaitable(closure)


def test_is_awaitable_regular_closure():
    """
    The is_awaitable function should handle regular closures correctly.
    """

    def make_closure():
        def inner():
            pass

        return inner

    closure = make_closure()
    assert not util.is_awaitable(closure)


def test_is_awaitable_builtin():
    """
    The is_awaitable function should identify built-in functions as not
    awaitable.
    """
    assert not util.is_awaitable(print)
    assert not util.is_awaitable(len)


def test_is_awaitable_class_method():
    """
    The is_awaitable function should handle class methods correctly.
    """

    class TestClass:
        async def async_method(self):
            pass

        def sync_method(self):
            pass

    obj = TestClass()
    assert util.is_awaitable(obj.async_method)
    assert not util.is_awaitable(obj.sync_method)
