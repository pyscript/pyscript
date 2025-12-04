"""
Filesystem mounting for Chromium-based browsers.

This module provides an API for mounting directories from the user's local
filesystem into the browser's virtual filesystem. This allows Python code
running in the browser to read and write files on the user's local machine.

**Important:** This API only works in Chromium-based browsers (Chrome, Edge,
Opera, Brave, etc.) that support the File System Access API.

For technical details of the underlying Chromium based API, see:

https://wicg.github.io/file-system-access/

The module maintains a `mounted` dictionary that tracks all currently mounted
paths and their associated filesystem handles.

```python
from pyscript import fs, document, when

# Mount a local directory to the `/local` mount point in the browser's
# virtual filesystem (may prompt user for permission).
await fs.mount("/local")

# Alternatively, mount on a button click event. This is important because
# if the call to `fs.mount` happens after a click or other transient event,
# the confirmation dialog will not be shown.
@when("click", "#mount-button")
async def handler(event):
    await fs.mount("/another_dir")

# Work with files in the mounted directory as usual.
with open("/local/example.txt", "w") as f:
    f.write("Hello from PyScript!")

# Ensure changes are written to local filesystem.
await fs.sync("/local")

# Clean up when done.
await fs.unmount("/local")
```
"""

import js
from _pyscript import fs as _fs, interpreter
from pyscript import window
from pyscript.ffi import to_js
from pyscript.context import RUNNING_IN_WORKER

# Worker-specific imports.
if RUNNING_IN_WORKER:
    from pyscript.context import sync as sync_with_worker
    from polyscript import IDBMap

# Global dictionary tracking mounted paths and their filesystem handles.
mounted = {}


async def _check_permission(details):
    """
    Check if permission has been granted for a filesystem handler. Returns
    the handler if permission is granted, otherwise None.
    """
    handler = details.handler
    options = details.options
    permission = await handler.queryPermission(options)
    return handler if permission == "granted" else None


async def mount(path, mode="readwrite", root="", id="pyscript"):
    """
    Mount a directory from the local filesystem to the virtual filesystem
    at the specified `path` mount point. The `mode` can be "readwrite" or
    "read" to specify access level. The `root` parameter provides a hint
    for the file picker starting location. The `id` parameter allows multiple
    distinct mounts at the same path.

    On first use, the browser will prompt the user to select a directory
    and grant permission.

    ```python
    from pyscript import fs

    # Basic mount with default settings.
    await fs.mount("/local")

    # Mount with read-only access.
    await fs.mount("/readonly", mode="read")

    # Mount with a hint to start in Downloads folder.
    await fs.mount("/downloads", root="downloads")

    # Mount with a custom ID to track different directories.
    await fs.mount("/project", id="my-project")
    ```

    If called during a user interaction (like a button click), the
    permission dialog may be skipped if permission was previously granted.
    """
    js.console.warn("experimental pyscript.fs ⚠️")

    # Check if path is already mounted with a different ID.
    mount_key = f"{path}@{id}"
    if path in mounted:
        # Path already mounted - check if it's the same ID.
        for existing_key in mounted.keys():
            if existing_key.startswith(f"{path}@") and existing_key != mount_key:
                raise ValueError(
                    f"Path '{path}' is already mounted with a different ID. "
                    f"Unmount it first or use a different path."
                )

    details = None
    handler = None

    options = {"id": id, "mode": mode}
    if root != "":
        options["startIn"] = root

    if RUNNING_IN_WORKER:
        fs_handler = sync_with_worker.storeFSHandler(mount_key, to_js(options))

        # Handle both async and SharedArrayBuffer use cases.
        if isinstance(fs_handler, bool):
            success = fs_handler
        else:
            success = await fs_handler

        if success:
            idbm = IDBMap.new(_fs.NAMESPACE)
            details = await idbm.get(mount_key)
            handler = await _check_permission(details)
            if handler is None:
                # Force await in either async or sync scenario.
                await js.Promise.resolve(sync_with_worker.getFSHandler(details.options))
                handler = details.handler
        else:
            raise RuntimeError(_fs.ERROR)

    else:
        success = await _fs.idb.has(mount_key)

        if success:
            details = await _fs.idb.get(mount_key)
            handler = await _check_permission(details)
            if handler is None:
                handler = await _fs.getFileSystemDirectoryHandle(details.options)
        else:
            js_options = to_js(options)
            handler = await _fs.getFileSystemDirectoryHandle(js_options)
            details = {"handler": handler, "options": js_options}
            await _fs.idb.set(mount_key, to_js(details))

    mounted[path] = await interpreter.mountNativeFS(path, handler)


async def sync(path):
    """
    Synchronise the virtual and local filesystems for a mounted `path`.

    This ensures all changes made in the browser's virtual filesystem are
    written to the user's local filesystem, and vice versa.

    ```python
    from pyscript import fs

    await fs.mount("/local")

    # Make changes to files.
    with open("/local/data.txt", "w") as f:
        f.write("Important data")

    # Ensure changes are written to local disk.
    await fs.sync("/local")
    ```

    This is automatically called by unmount(), but you may want to call
    it explicitly to ensure data persistence at specific points.
    """
    if path not in mounted:
        raise KeyError(
            f"Path '{path}' is not mounted. " f"Use fs.mount() to mount it first."
        )
    await mounted[path].syncfs()


async def unmount(path):
    """
    Unmount a directory, specified by `path`, from the virtual filesystem.

    This synchronises any pending changes and then removes the mount point,
    freeing up memory. The `path` can be reused for mounting a different
    directory.

    ```python
    from pyscript import fs

    await fs.mount("/local")
    # ... work with files ...
    await fs.unmount("/local")

    # Path can now be reused.
    await fs.mount("/local", id="different-folder")
    ```

    This automatically calls sync() before unmounting to ensure no data
    is lost.
    """
    if path not in mounted:
        raise KeyError(f"Path '{path}' is not mounted. Cannot unmount.")

    await sync(path)
    interpreter._module.FS.unmount(path)
    del mounted[path]


async def revoke(path, id="pyscript"):
    """
    Revoke filesystem access permission and unmount for a given
    `path` and `id` combination.

    This removes the stored permission for accessing the user's local
    filesystem at the specified path and ID. Unlike unmount(), which only
    removes the mount point, revoke() also clears the permission so the
    user will be prompted again on next mount.

    ```python
    from pyscript import fs

    await fs.mount("/local", id="my-app")
    # ... work with files ...

    # Revoke permission (user will be prompted again next time).
    revoked = await fs.revoke("/local", id="my-app")

    if revoked:
        print("Permission revoked successfully")
    ```

    After revoking, the user will need to grant permission again and
    select a directory when mount() is called next time.
    """
    mount_key = f"{path}@{id}"

    if RUNNING_IN_WORKER:
        handler_exists = sync_with_worker.deleteFSHandler(mount_key)
    else:
        handler_exists = await _fs.idb.has(mount_key)
        if handler_exists:
            handler_exists = await _fs.idb.delete(mount_key)

    if handler_exists:
        interpreter._module.FS.unmount(path)
        if path in mounted:
            del mounted[path]

    return handler_exists
