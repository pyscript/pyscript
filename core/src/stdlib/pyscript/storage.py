"""
This module wraps the browser's
[IndexedDB persistent storage](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
to provide a familiar Python dictionary API. Data is automatically
serialized and persisted, surviving page reloads and browser restarts.

Storage is persistent per origin (domain), isolated between different sites
for security. Browsers typically allow each origin to store up to 10-60% of
total disk space, depending on browser and configuration.

What this module provides:

- A `dict`-like API (get, set, delete, iterate).
- Automatic serialization of common Python types.
- Background persistence with optional explicit `sync()`.
- Support for custom `Storage` subclasses.

```python
from pyscript import storage


# Create or open a named storage.
my_data = await storage("user-preferences")

# Use like a regular dictionary.
my_data["theme"] = "dark"
my_data["font_size"] = 14
my_data["settings"] = {"notifications": True, "sound": False}

# Changes are queued automatically.
# To ensure immediate write, sync explicitly.
await my_data.sync()

# Read values (survives page reload).
theme = my_data.get("theme", "light")
```

Common types are automatically serialized: `bool`, `int`, `float`, `str`, `None`,
`list`, `dict`, `tuple`. Binary data (`bytearray`, `memoryview`) can be stored as
single values but not nested in structures.

Tuples are deserialized as lists due to IndexedDB limitations.

!!! info
    Browsers typically allow 10-60% of total disk space per origin. Chrome
    and Edge allow up to 60%, Firefox up to 10 GiB (or 10% of disk, whichever
    is smaller). Safari varies by app type. These limits are unlikely to be
    reached in typical usage.
"""

from polyscript import storage as _polyscript_storage
from pyscript.flatted import parse as _parse
from pyscript.flatted import stringify as _stringify
from pyscript.ffi import is_none


def _convert_to_idb(value):
    """
    Convert a Python `value` to an IndexedDB-compatible format.

    Values are serialized using Flatted (for circular reference support)
    with type information to enable proper deserialization. It returns a
    JSON string representing the serialized value.

    Will raise a TypeError if the value type is not supported.
    """
    if is_none(value):
        return _stringify(["null", 0])
    if isinstance(value, (bool, float, int, str, list, dict, tuple)):
        return _stringify(["generic", value])
    if isinstance(value, bytearray):
        return _stringify(["bytearray", list(value)])
    if isinstance(value, memoryview):
        return _stringify(["memoryview", list(value)])
    raise TypeError(f"Cannot serialize type {type(value).__name__} for storage.")


def _convert_from_idb(value):
    """
    Convert an IndexedDB `value` back to its Python representation.

    Uses type information stored during serialization to reconstruct the
    original Python type.
    """
    kind, data = _parse(value)

    if kind == "null":
        return None
    if kind == "generic":
        return data
    if kind == "bytearray":
        return bytearray(data)
    if kind == "memoryview":
        return memoryview(bytearray(data))
    # Fallback for all other types.
    return value


class Storage(dict):
    """
    A persistent dictionary backed by the browser's IndexedDB.

    This class provides a dict-like interface with automatic persistence.
    Changes are queued for background writing, with optional explicit
    synchronization via `sync()`.

    Inherits from `dict`, so all standard dictionary methods work as expected.

    ```python
    from pyscript import storage


    # Open a storage.
    prefs = await storage("preferences")

    # Use as a dictionary.
    prefs["color"] = "blue"
    prefs["count"] = 42

    # Iterate like a dict.
    for key, value in prefs.items():
        print(f"{key}: {value}")

    # Ensure writes complete immediately.
    await prefs.sync()
    ```

    Sometimes you may need to subclass `Storage` to add custom behavior:

    ```python
    from pyscript import storage, Storage, window


    class LoggingStorage(Storage):
        def __setitem__(self, key, value):
            window.console.log(f"Setting {key} = {value}")
            super().__setitem__(key, value)

    my_store = await storage("app-data", storage_class=LoggingStorage)
    my_store["test"] = 123  # Logs to console.
    ```
    """

    def __init__(self, store):
        """
        Create a Storage instance wrapping an IndexedDB `store` (a JS
        proxy).
        """
        super().__init__(
            {key: _convert_from_idb(value) for key, value in store.entries()}
        )
        self._store = store

    def __delitem__(self, key):
        """
        Delete an item from storage via its `key`.

        The deletion is queued for persistence. Use `sync()` to ensure
        immediate completion.
        """
        self._store.delete(key)
        super().__delitem__(key)

    def __setitem__(self, key, value):
        """
        Set a `key` to a `value` in storage.

        The change is queued for persistence. Use `sync()` to ensure
        immediate completion. The `value` must be a supported type for
        serialization.
        """
        self._store.set(key, _convert_to_idb(value))
        super().__setitem__(key, value)

    def clear(self):
        """
        Remove all items from storage.

        The `clear()` operation is queued for persistence. Use `sync()` to ensure
        immediate completion.
        """
        self._store.clear()
        super().clear()

    async def sync(self):
        """
        Force immediate synchronization to IndexedDB.

        By default, storage operations are queued and written asynchronously.
        Call `sync()` when you need to guarantee changes are persisted immediately,
        such as before critical operations or page unload.

        ```python
        store = await storage("important-data")
        store["critical_value"] = data

        # Ensure it's written before proceeding.
        await store.sync()
        ```

        This is a blocking operation that waits for IndexedDB to complete
        the write.
        """
        await self._store.sync()


async def storage(name="", storage_class=Storage):
    """
    Open or create persistent storage with a unique `name` and optional
    `storage_class` (used to extend the default `Storage` based behavior).

    Each storage is isolated by name within the current origin (domain).
    If the storage doesn't exist, it will be created. If it does exist,
    its current contents will be loaded.

    This function returns a `Storage` instance (or custom subclass instance)
    acting as a persistent dictionary. A `ValueError` is raised if `name` is
    empty or not provided.

    ```python
    from pyscript import storage


    # Basic usage.
    user_data = await storage("user-profile")
    user_data["name"] = "Alice"
    user_data["age"] = 30

    # Multiple independent storages.
    settings = await storage("app-settings")
    cache = await storage("api-cache")

    # With custom Storage class.
    class ValidatingStorage(Storage):
        def __setitem__(self, key, value):
            if not isinstance(key, str):
                raise TypeError("Keys must be strings")
            super().__setitem__(key, value)

    validated = await storage("validated-data", ValidatingStorage)
    ```

    Storage names are automatically prefixed with `"@pyscript/"` to
    namespace them within IndexedDB.
    """
    if not name:
        raise ValueError("Storage name must be a non-empty string")

    underlying_store = await _polyscript_storage(f"@pyscript/{name}")
    return storage_class(underlying_store)
