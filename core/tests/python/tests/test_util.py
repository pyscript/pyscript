import upytest
import js
from pyscript import util


def test_as_bytearray():
    """
    Test the as_bytearray function correctly converts a JavaScript ArrayBuffer
    to a Python bytearray.
    """
    msg = b"Hello, world!"
    buffer = js.ArrayBuffer.new(len(msg))
    ui8a = js.Uint8Array.new(buffer)
    for b in msg:
        ui8a[i] = b
    ba = util.as_bytearray(buffer)
    assert isinstance(ba, bytearray)
    assert ba == msg


def test_not_supported():
    """
    Test the NotSupported class raises an exception when trying to access
    attributes or call the object.
    """
    ns = util.NotSupported("test", "This is not supported.")
    with upytest.raises(AttributeError) as e:
        ns.test
    assert str(e.exception) == "This is not supported.", str(e.exception)
    with upytest.raises(AttributeError) as e:
        ns.test = 1
    assert str(e.exception) == "This is not supported.", str(e.exception)
    with upytest.raises(TypeError) as e:
        ns()
    assert str(e.exception) == "This is not supported.", str(e.exception)


def test_is_awaitable():
    """
    Test the is_awaitable function correctly identifies an asynchronous
    function.
    """

    async def async_func():
        yield

    assert util.is_awaitable(async_func)
    assert not util.is_awaitable(lambda: None)
