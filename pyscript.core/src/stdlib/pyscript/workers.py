import js as _js

from polyscript import workers as _workers

_get = _js.Reflect.get

# this solves an inconsistency between Pyodide and MicroPython
# @see https://github.com/pyscript/pyscript/issues/2106
class _ReadOnlyProxy:
    def __getitem__(self, name):
        return _get(_workers, name)
    def __getattr__(self, name):
        return _get(_workers, name)

workers = _ReadOnlyProxy()
