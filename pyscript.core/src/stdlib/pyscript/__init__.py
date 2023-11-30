# Some notes about the naming conventions and the relationship between various
# similar-but-different names.
#
# import pyscript
#     this package contains the main user-facing API offered by pyscript. All
#     the names which are supposed be used by end users should be made
#     available in pyscript/__init__.py (i.e., this file)
#
# import _pyscript
#     this is an internal module implemented in JS. It is used internally by
#     the pyscript package, end users should not use it directly. For its
#     implementation, grep for `interpreter.registerJsModule("_pyscript",
#     ...)` in core.js
#
# import js
#     this is the JS globalThis, as exported by pyodide and/or micropython's
#     FFIs. As such, it contains different things in the main thread or in a
#     worker.
#
# import pyscript.magic_js
#     this submodule abstracts away some of the differences between the main
#     thread and the worker. In particular, it defines `window` and `document`
#     in such a way that these names work in both cases: in the main thread,
#     they are the "real" objects, in the worker they are proxies which work
#     thanks to coincident.
#
# from pyscript import window, document
#     these are just the window and document objects as defined by
#     pyscript.magic_js. This is the blessed way to access them from pyscript,
#     as it works transparently in both the main thread and worker cases.

from pyscript.display import HTML, display
from pyscript.magic_js import (
    RUNNING_IN_WORKER,
    PyWorker,
    current_target,
    document,
    js_modules,
    sync,
    window,
)

try:
    from pyscript.event_handling import when
except:
    from pyscript.util import NotSupported

    when = NotSupported(
        "pyscript.when", "pyscript.when currently not available with this interpreter"
    )
