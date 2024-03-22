try:
    from pyodide.ffi import create_proxy as _cp, to_js as _py_tjs
    import js
    from_entries = js.Object.fromEntries

    def _tjs(value, **kw):
      if not hasattr(kw, "dict_converter"):
        kw["dict_converter"] = from_entries
      return _py_tjs(value, **kw)

except:
    from jsffi import create_proxy as _cp, to_js as _tjs

create_proxy = _cp
to_js = _tjs
