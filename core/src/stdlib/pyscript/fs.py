mounted = {}

async def get_handler(details):
    handler = details.handler
    options = details.options
    permission = await handler.queryPermission(options)
    return handler if permission == "granted" else None


async def mount(path, mode="readwrite", root="", id="pyscript"):
    import js
    from _pyscript import fs, interpreter
    from pyscript.ffi import to_js
    from pyscript.magic_js import (
        RUNNING_IN_WORKER,
        sync,
    )

    js.console.warn("experimental pyscript.fs ⚠️")

    details = None
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
            from pyscript import window

            idbm = IDBMap.new(fs.NAMESPACE)
            details = await idbm.get(uid)
            handler = await get_handler(details)
            if handler is None:
                # force await in either async or sync scenario
                await js.Promise.resolve(sync.getFSHandler(details.options))
                handler = details.handler

        else:
            raise RuntimeError(fs.ERROR)

    else:
        success = await fs.idb.has(uid)

        if success:
            details = await fs.idb.get(uid)
            handler = await get_handler(details)
            if handler is None:
                handler = await fs.getFileSystemDirectoryHandle(details.options)
        else:
            js_options = to_js(options)
            handler = await fs.getFileSystemDirectoryHandle(js_options)
            details = { "handler": handler, "options": js_options }
            await fs.idb.set(uid, to_js(details))

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
