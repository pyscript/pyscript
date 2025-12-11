"""
Execution context management for PyScript.

This module handles the differences between running in the
[main browser thread](https://developer.mozilla.org/en-US/docs/Glossary/Main_thread)
versus running in a
[Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers),
providing a consistent API regardless of the execution context.

Key features:

- Detects whether code is running in a worker or main thread. Read this via
  the boolean `pyscript.context.RUNNING_IN_WORKER`.
- Parses and normalizes configuration from `polyscript.config` and adds the
  Python interpreter type via the `type` key in `pyscript.context.config`.
- Provides appropriate implementations of `window`, `document`, and `sync`.
- Sets up JavaScript module import system, including a lazy `js_import`
  function.
- Manages `PyWorker` creation.
- Provides access to the current display target via
  `pyscript.context.display_target`.

!!! warning

    These are key differences between the main thread and worker contexts:

    Main thread context:

    - `window` and `document` are available directly.
    - `PyWorker` can be created to spawn worker threads.
    - `sync` is not available (raises `NotSupported`).

    Worker context:

    - `window` and `document` are proxied from main thread (if SharedArrayBuffer
    available).
    - `PyWorker` is not available (raises `NotSupported`).
    - `sync` utilities are available for main thread communication.
"""

import json
import sys

import js
from polyscript import config as _polyscript_config
from polyscript import js_modules
from pyscript.util import NotSupported

RUNNING_IN_WORKER = not hasattr(js, "document")
"""Detect execution context: True if running in a worker, False if main thread."""

config = json.loads(js.JSON.stringify(_polyscript_config))
"""Parsed and normalized configuration."""
if isinstance(config, str):
    config = {}

js_import = None
"""Function to import JavaScript modules dynamically."""

window = None
"""The `window` object (proxied if in a worker)."""

document = None
"""The `document` object (proxied if in a worker)."""

sync = None
"""Sync utilities for worker-main thread communication (only in workers)."""

# Detect and add Python interpreter type to config.
if "MicroPython" in sys.version:
    config["type"] = "mpy"
else:
    config["type"] = "py"


class _JSModuleProxy:
    """
    Proxy for JavaScript modules imported via js_modules.

    This allows Python code to import JavaScript modules using Python's
    import syntax:

    ```python
    from pyscript.js_modules lodash import debounce
    ```

    The proxy lazily retrieves the actual JavaScript module when accessed.
    """

    def __init__(self, name):
        """
        Create a proxy for the named JavaScript module.
        """
        self.name = name

    def __getattr__(self, field):
        """
        Retrieve a JavaScript object/function from the proxied JavaScript
        module via the given `field` name.
        """
        # Avoid Pyodide looking for non-existent special methods.
        if not field.startswith("_"):
            return getattr(getattr(js_modules, self.name), field)
        return None


# Register all available JavaScript modules in Python's module system.
# This enables: from pyscript.js_modules.xxx import yyy
for module_name in js.Reflect.ownKeys(js_modules):
    sys.modules[f"pyscript.js_modules.{module_name}"] = _JSModuleProxy(module_name)
sys.modules["pyscript.js_modules"] = js_modules


# Context-specific setup: Worker vs Main Thread.
if RUNNING_IN_WORKER:
    import polyscript

    # PyWorker cannot be created from within a worker.
    PyWorker = NotSupported(
        "pyscript.PyWorker",
        "pyscript.PyWorker works only when running in the main thread",
    )

    # Attempt to access main thread's window and document via SharedArrayBuffer.
    try:
        window = polyscript.xworker.window
        document = window.document
        js.document = document

        # Create js_import function that runs imports on the main thread.
        js_import = window.Function(
            "return (...urls) => Promise.all(urls.map((url) => import(url)))"
        )()

    except:
        # SharedArrayBuffer not available - window/document cannot be proxied.
        sab_error_message = (
            "Unable to use `window` or `document` in worker. "
            "This requires SharedArrayBuffer support. "
            "See: https://docs.pyscript.net/latest/faq/#sharedarraybuffer"
        )
        js.console.warn(sab_error_message)
        window = NotSupported("pyscript.window", sab_error_message)
        document = NotSupported("pyscript.document", sab_error_message)

    # Worker-specific utilities for main thread communication.
    sync = polyscript.xworker.sync

    def current_target():
        """
        Get the current output target in worker context.
        """
        return polyscript.target

else:
    # Main thread context setup.
    import _pyscript
    from _pyscript import PyWorker as _PyWorker
    from pyscript.ffi import to_js

    js_import = _pyscript.js_import

    def PyWorker(url, **options):
        """
        Create a Web Worker running Python code.

        This spawns a new worker thread that can execute Python code
        found at the `url`, independently of the main thread. The
        `**options` can be used to configure the worker.

        ```python
        from pyscript import PyWorker


        # Create a worker to run background tasks.
        # (`type` MUST be either `micropython` or `pyodide`)
        worker = PyWorker("./worker.py", type="micropython")
        ```

        PyWorker **can only be created from the main thread**, not from
        within another worker.
        """
        return _PyWorker(url, to_js(options))

    # Main thread has direct access to window and document.
    window = js
    document = js.document

    # sync is not available in main thread (only in workers).
    sync = NotSupported(
        "pyscript.sync", "pyscript.sync works only when running in a worker"
    )

    def current_target():
        """
        Get the current output target in main thread context.
        """
        return _pyscript.target
