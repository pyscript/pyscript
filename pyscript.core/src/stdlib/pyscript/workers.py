import js as _js
from polyscript import workers as _workers

_get = _js.Reflect.get


def _set(script, name, value=""):
    script.setAttribute(name, value)


# this solves an inconsistency between Pyodide and MicroPython
# @see https://github.com/pyscript/pyscript/issues/2106
class _ReadOnlyProxy:
    def __getitem__(self, name):
        return _get(_workers, name)

    def __getattr__(self, name):
        return _get(_workers, name)


workers = _ReadOnlyProxy()


async def create_named_worker(src="", name="", config=None, type="py"):
    from json import dumps

    if not src:
        raise ValueError("Named workers require src")

    if not name:
        raise ValueError("Named workers require a name")

    s = _js.document.createElement("script")
    s.type = type
    s.src = src
    _set(s, "worker")
    _set(s, "name", name)

    if config:
        _set(s, "config", isinstance(config, str) and config or dumps(config))

    _js.document.body.append(s)
    return await workers[name]
