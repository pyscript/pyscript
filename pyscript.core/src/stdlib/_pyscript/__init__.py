import js as window

IS_WORKER = not hasattr(window, "document")

if IS_WORKER:
    from polyscript import xworker as _xworker

    window = _xworker.window
    document = window.document
    sync = _xworker.sync
else:
    document = window.document
