"""
This module provides access to named
[web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
defined in `<script>` tags, and utilities for dynamically creating workers
from Python code.

Named workers are Python web workers defined in HTML with a `name` attribute
that can be referenced from the main thread or other workers. This module
provides the `workers` object for accessing named workers and the
`create_named_worker()` function for dynamically creating them.

Accessing named workers:

```html
<!-- Define a named worker -->
<script type="py" worker name="calculator">
def add(a, b):
    return a + b

__export__ = ["add"]
</script>

<!-- Access from main thread -->
<script type="mpy">
from pyscript import workers


calc = await workers["calculator"]
result = await calc.add(5, 3)
print(result)  # 8
</script>
```

Dynamically creating named workers:

```python
from pyscript import create_named_worker


# Create a worker from a Python file.
worker = await create_named_worker(
    src="./background_tasks.py",
    name="task-processor"
)

# Use the worker's exported functions.
result = await worker.process_data([1, 2, 3, 4, 5])
print(result)
```

Key features:
- Access (`await`) named workers via dictionary-like syntax.
- Dynamically create workers from Python.
- Cross-interpreter support (Pyodide and MicroPython).

Worker access is asynchronous - you must `await workers[name]` to get
a reference to the worker. This is because workers may not be ready
immediately at startup.
"""

import js
import json
from polyscript import workers as _polyscript_workers


class _ReadOnlyWorkersProxy:
    """
    A read-only proxy for accessing named web workers. Use
    `create_named_worker()` to create new workers found in this proxy.

    This provides dictionary-like access to named workers defined in
    the page. It handles differences between Pyodide and MicroPython
    implementations transparently.

    (See: https://github.com/pyscript/pyscript/issues/2106 for context.)

    The proxy is read-only to prevent accidental modification of the
    underlying workers registry. Both item access and attribute access are
    supported for convenience (especially since HTML attribute names may
    not be valid Python identifiers).

    ```python
    from pyscript import workers

    # Access a named worker.
    my_worker = await workers["worker-name"]
    result = await my_worker.some_function()

    # Alternatively, if the name works, access via attribute notation.
    my_worker = await workers.worker_name
    result = await my_worker.some_function()
    ```

    **This is a proxy object, not a dict**. You cannot iterate over it or
    get a list of worker names. This is intentional because worker
    startup timing is non-deterministic.
    """

    def __getitem__(self, name):
        """
        Get a named worker by `name`. It returns a promise that resolves to
        the worker reference when ready.

        This is useful if the underlying worker name is not a valid Python
        identifier.

        ```python
        worker = await workers["my-worker"]
        ```
        """
        return js.Reflect.get(_polyscript_workers, name)

    def __getattr__(self, name):
        """
        Get a named worker as an attribute. It returns a promise that resolves
        to the worker reference when ready.

        This allows accessing workers via dot notation as an alternative
        to bracket notation.

        ```python
        worker = await workers.my_worker
        ```
        """
        return js.Reflect.get(_polyscript_workers, name)


# Global workers proxy for accessing named workers.
workers = _ReadOnlyWorkersProxy()
"""Global proxy for accessing named web workers."""


async def create_named_worker(src, name, config=None, type="py"):
    """
    Dynamically create a web worker with a `src` Python file, a unique
    `name` and optional `config` (dict or JSON string) and `type` (`py`
    for Pyodide or `mpy` for MicroPython, the default is `py`).

    This function creates a new web worker by injecting a `<script>` tag into
    the document. The worker will be accessible via the `workers` proxy once
    it's ready.

    It returns a promise that resolves to the worker reference when ready.

    ```python
    from pyscript import create_named_worker


    # Create a Pyodide worker.
    worker = await create_named_worker(
        src="./my_worker.py",
        name="background-worker"
    )

    # Use the worker.
    result = await worker.process_data()

    # Create with standard PyScript configuration.
    worker = await create_named_worker(
        src="./processor.py",
        name="data-processor",
        config={"packages": ["numpy", "pandas"]}
    )

    # Use MicroPython instead.
    worker = await create_named_worker(
        src="./lightweight_worker.py",
        name="micro-worker",
        type="mpy"
    )
    ```

    !!! info

        **The worker script should define** `__export__` to specify which
        functions or objects are accessible from the main thread.
    """
    # Create script element for the worker.
    script = js.document.createElement("script")
    script.type = type
    script.src = src
    # Mark as a worker with a name.
    script.setAttribute("worker", "")
    script.setAttribute("name", name)
    # Add configuration if provided.
    if config:
        if isinstance(config, str):
            config_str = config
        else:
            config_str = json.dumps(config)
        script.setAttribute("config", config_str)
    # Inject the script into the document and await the result.
    js.document.body.append(script)
    return await workers[name]
