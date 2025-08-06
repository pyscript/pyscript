mounted = {}


async def mount(path, mode="readwrite", root="", id="pyscript"):
    import js
    from _pyscript import fs, interpreter
    from pyscript.ffi import to_js
    from pyscript.magic_js import (
        RUNNING_IN_WORKER,
        sync,
    )

    js.console.warn("experimental pyscript.fs ⚠️")

    handler = None

    uid = f"{path}@{id}"

    options = {"id": id, "mode": mode}
    if root != "":
        options["startIn"] = root

    if RUNNING_IN_WORKER:
        fsh = sync.storeFSHandler(uid, to_js(options))

        # allow both async and/or SharedArrayBuffer use case
        if isinstance(fsh, bool):
            success = fsh
        else:
            success = await fsh

        if success:
            from polyscript import IDBMap

            idb = IDBMap.new(fs.NAMESPACE)
            handler = await idb.get(uid)
        else:
            raise RuntimeError(fs.ERROR)

    else:
        success = await fs.idb.has(uid)

        if success:
            handler = await fs.idb.get(uid)
        else:
            handler = await fs.getFileSystemDirectoryHandle(to_js(options))
            await fs.idb.set(uid, handler)

    mounted[path] = await interpreter.mountNativeFS(path, handler)


async def revoke(path, id="pyscript"):
    from _pyscript import fs, interpreter
    from pyscript.magic_js import (
        RUNNING_IN_WORKER,
        sync,
    )

    uid = f"{path}@{id}"

    if RUNNING_IN_WORKER:
        had = sync.deleteFSHandler(uid)
    else:
        had = await fs.idb.has(uid)
        if had:
            had = await fs.idb.delete(uid)

    if had:
        interpreter._module.FS.unmount(path)

    return had


async def sync(path):
    await mounted[path].syncfs()


async def unmount(path):
    from _pyscript import interpreter

    await sync(path)
    interpreter._module.FS.unmount(path)
