"""
Exercise (as much as is possible) the pyscript.ffi namespace.
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
