"""
This is the main `pyscript` namespace. It provides the primary Pythonic API
for users to interact with the
[browser's own API](https://developer.mozilla.org/en-US/docs/Web/API). It
includes utilities for common activities such as displaying content, handling
events, fetching resources, managing local storage, and coordinating with
web workers.

The most important names provided by this namespace can be directly imported
from `pyscript`, for example:

```python
from pyscript import display, HTML, fetch, when, storage, WebSocket
```

The following names are available in the `pyscript` namespace:

- `RUNNING_IN_WORKER`: Boolean indicating if the code is running in a Web
  Worker.
- `PyWorker`: Class for creating Web Workers running Python code.
- `config`: Configuration object for pyscript settings.
- `current_target`: The element in the DOM that is the current target for
  output.
- `document`: The standard `document` object, proxied in workers.
- `window`: The standard `window` object, proxied in workers.
- `js_import`: Function to dynamically import JS modules.
- `js_modules`: Object containing JS modules available to Python.
- `sync`: Utility for synchronizing between worker and main thread.
- `display`: Function to render Python objects in the web page.
- `HTML`: Helper class to create HTML content for display.
- `fetch`: Function to perform HTTP requests.
- `Storage`: Class representing browser storage (local/session).
- `storage`: Object to interact with browser's local storage.
- `WebSocket`: Class to create and manage WebSocket connections.
- `when`: Function to register event handlers on DOM elements.
- `Event`: Class representing user defined or DOM events.
- `py_import`: Function to lazily import Pyodide related Python modules.

If running in the main thread, the following additional names are available:

- `create_named_worker`: Function to create a named Web Worker.
- `workers`: Object to manage and interact with existing Web Workers.

All of these names are defined in the various submodules of `pyscript` and
are imported and re-exported here for convenience. Please refer to the
respective submodule documentation for more details on each component.


!!! Note
    Some notes about the naming conventions and the relationship between
    various similar-but-different names found within this code base.

    ```python
    import pyscript
    ```

    The `pyscript` package contains the main user-facing API offered by
    PyScript. All the names which are supposed be used by end users should
    be made available in `pyscript/__init__.py` (i.e., this source file).

    ```python
    import _pyscript
    ```

    The `_pyscript` module is an internal API implemented in JS. **End users
    should not use it directly**. For its implementation, grep for
    `interpreter.registerJsModule("_pyscript",...)` in `core.js`.

    ```python
    import js
    ```

    The `js` object is
    [the JS `globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis),
    as exported by Pyodide and/or Micropython's foreign function interface
    (FFI). As such, it contains different things in the main thread or in a
    worker, as defined by web standards.

    ```python
    import pyscript.context
    ```

    The `context` submodule abstracts away some of the differences between
    the main thread and a worker. Its most important features are made
    available in the root `pyscript` namespace. All other functionality is
    mostly for internal PyScript use or advanced users. In particular, it
    defines `window` and `document` in such a way that these names work in
    both cases: in the main thread, they are the "real" objects, in a worker
    they are proxies which work thanks to
    [coincident](https://github.com/WebReflection/coincident).

    ```python
    from pyscript import window, document
    ```

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
