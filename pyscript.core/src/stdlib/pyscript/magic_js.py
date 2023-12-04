import js as globalThis
from polyscript import js_modules
from pyscript.util import NotSupported

RUNNING_IN_WORKER = not hasattr(globalThis, "document")

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
