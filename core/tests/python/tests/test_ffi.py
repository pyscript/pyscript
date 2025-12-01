"""
Exercise (as much as is possible) the pyscript.ffi namespace.

We assume that the underlying `create_proxy` and `to_js` functions
work as expected (these are tested in Pyodide and MicroPython respectively).
"""

import upytest
from pyscript import ffi


def test_create_proxy():
    """
    The create_proxy function should return a proxy object that is callable.
    """

    def func():
        return 42

    proxy = ffi.create_proxy(func)
    assert proxy() == 42
    if upytest.is_micropython:
        from jsffi import JsProxy
    else:
        from pyodide.ffi import JsProxy
    assert isinstance(proxy, JsProxy)


def test_to_js():
    """
    The to_js function should convert a Python object to a JavaScript object.
    In this instance, a Python dict should be converted to a JavaScript object
    represented by a JsProxy object.
    """
    obj = {"a": 1, "b": 2}
    js_obj = ffi.to_js(obj)
    assert js_obj.a == 1
    assert js_obj.b == 2
    if upytest.is_micropython:
        from jsffi import JsProxy
    else:
        from pyodide.ffi import JsProxy
    assert isinstance(js_obj, JsProxy)


def test_is_none_with_python_none():
    """
    The is_none function should return True for Python None.
    """
    assert ffi.is_none(None)


def test_is_none_with_js_null():
    """
    The is_none function should return True for JavaScript null.
    """
    import js

    assert ffi.is_none(ffi.jsnull)


def test_is_none_with_other_values():
    """
    The is_none function should return False for non-null false-y
    values.
    """
    assert not ffi.is_none(0)
    assert not ffi.is_none("")
    assert not ffi.is_none(False)
    assert not ffi.is_none([])
    assert not ffi.is_none({})


def test_assign_single_source():
    """
    The assign function should merge a single source object into target.
    """
    import js

    target = js.Object.new()
    ffi.assign(target, {"a": 1, "b": 2})

    assert target.a == 1
    assert target.b == 2


def test_assign_multiple_sources():
    """
    The assign function should merge multiple source objects into target.
    """
    import js

    target = js.Object.new()
    ffi.assign(target, {"a": 1}, {"b": 2}, {"c": 3})

    assert target.a == 1
    assert target.b == 2
    assert target.c == 3


def test_assign_overwrites_properties():
    """
    The assign function should overwrite existing properties.
    """
    import js

    target = js.Object.new()
    target.a = 1
    ffi.assign(target, {"a": 2, "b": 3})

    assert target.a == 2
    assert target.b == 3


def test_assign_returns_target():
    """
    The assign function should return the modified target object.
    """
    import js

    target = js.Object.new()
    result = ffi.assign(target, {"a": 1})

    assert result is target
    assert result.a == 1
