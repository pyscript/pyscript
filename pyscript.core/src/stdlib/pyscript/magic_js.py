import json
import sys

import js as globalThis
from polyscript import config as _config
from polyscript import js_modules
from pyscript.util import NotSupported

RUNNING_IN_WORKER = not hasattr(globalThis, "document")

config = json.loads(globalThis.JSON.stringify(_config))


# allow `from pyscript.js_modules.xxx import yyy`
class JSModule:
    def __init__(self, name):
        self.name = name

    def __getattr__(self, field):
        # avoid pyodide looking for non existent fields
        if not field.startswith("_"):
            return getattr(getattr(js_modules, self.name), field)


# generate N modules in the system that will proxy the real value
for name in globalThis.Reflect.ownKeys(js_modules):
    sys.modules[f"pyscript.js_modules.{name}"] = JSModule(name)
sys.modules["pyscript.js_modules"] = js_modules

if RUNNING_IN_WORKER:
    import polyscript

    PyWorker = NotSupported(
        "pyscript.PyWorker",
        "pyscript.PyWorker works only when running in the main thread",
    )

    try:
        globalThis.SharedArrayBuffer.new(4)
        import js

        window = polyscript.xworker.window
        document = window.document
        js.document = document
    except:
        globalThis.console.debug("SharedArrayBuffer is not available")
        # in this scenario none of the utilities would work
        # as expected so we better export these as NotSupported
        window = NotSupported(
            "pyscript.window",
            "pyscript.window in workers works only via SharedArrayBuffer",
        )
        document = NotSupported(
            "pyscript.document",
            "pyscript.document in workers works only via SharedArrayBuffer",
        )

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
