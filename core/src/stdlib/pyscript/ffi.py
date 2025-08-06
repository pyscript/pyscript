try:
    import js
    from pyodide.ffi import create_proxy as _cp
    from pyodide.ffi import to_js as _py_tjs
    from pyodide.ffi import jsnull

    from_entries = js.Object.fromEntries
    is_none = lambda value: value is None or value is jsnull

    def _tjs(value, **kw):
        if not hasattr(kw, "dict_converter"):
            kw["dict_converter"] = from_entries
        return _py_tjs(value, **kw)

except:
    from jsffi import create_proxy as _cp
    from jsffi import to_js as _tjs
    import js

    jsnull = js.Object.getPrototypeOf(js.Object.prototype)
    is_none = lambda value: value is None or value is jsnull

create_proxy = _cp
to_js = _tjs

try:
    from polyscript import ffi as _ffi

    direct = _ffi.direct
    gather = _ffi.gather
    query = _ffi.query

    def assign(source, *args):
        for arg in args:
            _ffi.assign(source, to_js(arg))
        return source

except:
    import js

    _assign = js.Object.assign

    direct = lambda source: source

    def assign(source, *args):
        for arg in args:
            _assign(source, to_js(arg))
        return source
