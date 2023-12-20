import sys
from types import ModuleType

import js as globalThis
from polyscript import js_modules
from pyscript.util import NotSupported

RUNNING_IN_WORKER = not hasattr(globalThis, "document")


# allow `from pyscript.js_modules.xxx import yyy`
class JSModule(object):
    def __init__(self, name):
        self.name = name

    def __getattr__(self, field):
        # avoid pyodide looking for non existent fields
        if field[0] != "_":
            return getattr(getattr(js_modules, self.name), field)


# generate N modules in the system that will proxy the real value
for name in globalThis.Reflect.ownKeys(js_modules):
    sys.modules[f"pyscript.js_modules.{name}"] = JSModule(name)
sys.modules["pyscript.js_modules"] = js_modules

if RUNNING_IN_WORKER:
    import js
    import polyscript

    PyWorker = NotSupported(
        "pyscript.PyWorker",
        "pyscript.PyWorker works only when running in the main thread",
    )
    window = polyscript.xworker.window
    document = window.document
    js.document = document
    sync = polyscript.xworker.sync

    # in workers the display does not have a default ID
    # but there is a sync utility from xworker
    def current_target():
        return polyscript.target

else:
    import _pyscript
    from _pyscript import PyWorker

    window = globalThis
    document = globalThis.document
    sync = NotSupported(
        "pyscript.sync", "pyscript.sync works only when running in a worker"
    )

    # in MAIN the current element target exist, just use it
    def current_target():
        return _pyscript.target
