import js as globalThis

RUNNING_IN_WORKER = not hasattr(globalThis, "document")

if RUNNING_IN_WORKER:
    import polyscript

    # XXX we should use a "smarter" object which emits a clearer error message
    # if you try to access it
    PyWorker = None

    window = polyscript.xworker.window
    document = window.document
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
    # XXX we should use a "smarter" object which emits a clearer error message
    # if you try to access it
    sync = None

    # in MAIN the current element target exist, just use it
    def current_target():
        return _pyscript.target
