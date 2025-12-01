"""
This is the main `pyscript` namespace. It provides the primary Pythonic API
for users to interact with PyScript features sitting on top of the browser's
own API (https://developer.mozilla.org/en-US/docs/Web/API). It includes
utilities for common activities such as displaying content, handling events,
fetching resources, managing local storage, and coordinating with web workers.

Some notes about the naming conventions and the relationship between various
similar-but-different names found within this code base.

`import pyscript`

This package contains the main user-facing API offered by pyscript. All
the names which are supposed be used by end users should be made
available in pyscript/__init__.py (i.e., this file).

`import _pyscript`

This is an internal module implemented in JS. It is used internally by
the pyscript package, **end users should not use it directly**. For its
implementation, grep for `interpreter.registerJsModule("_pyscript",
...)` in `core.js`.

`import js`

This is the JS `globalThis`, as exported by Pyodide and/or Micropython's
foreign function interface (FFI). As such, it contains different things in
the main thread or in a worker, as defined by web standards.

`import pyscript.context`

This submodule abstracts away some of the differences between the main
thread and a worker. In particular, it defines `window` and `document`
in such a way that these names work in both cases: in the main thread,
they are the "real" objects, in a worker they are proxies which work
thanks to [coincident](https://github.com/WebReflection/coincident).

`from pyscript import window, document`

These are just the `window` and `document` objects as defined by
`pyscript.context`. This is the blessed way to access them from `pyscript`,
as it works transparently in both the main thread and worker cases.
"""

from polyscript import lazy_py_modules as py_import
from pyscript.context import (
    RUNNING_IN_WORKER,
    PyWorker,
    config,
    current_target,
    document,
    js_import,
    js_modules,
    sync,
    window,
)
from pyscript.display import HTML, display
from pyscript.fetch import fetch
from pyscript.storage import Storage, storage
from pyscript.websocket import WebSocket
from pyscript.events import when, Event

if not RUNNING_IN_WORKER:
    from pyscript.workers import create_named_worker, workers
