try:
    from pyodide.code import eval_code
    from pyodide.ffi import JsProxy, create_once_callable, create_proxy
except ImportError:
    from pyodide import JsProxy, create_once_callable, create_proxy, eval_code

__all__ = ["JsProxy", "create_proxy", "eval_code", "create_once_callable"]
