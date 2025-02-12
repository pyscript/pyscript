mounted = {}

async def mount(path, mode = "readwrite", root = "", id = "pyscript"):
    from _pyscript import fs, interpreter
    from pyscript.ffi import to_js
    from pyscript.magic_js import (
        RUNNING_IN_WORKER,
        sync,
    )

    handler = None

    options = { "id": id, "mode": mode }
    if root != "":
        options["startIn"] = root

    if RUNNING_IN_WORKER:
        success = await sync.storeFSHandler(path, to_js(options))
        if success:
            from polyscript import IDBMap
            idb = IDBMap.new(fs.NAMESPACE)
            handler = await idb.get(path)
        else:
            raise Error(fs.ERROR)

    else:
        success = await fs.idb.has(path)

        if success:
            handler = await fs.idb.get(path)
        else:
            handler = await fs.getFileSystemDirectoryHandle(to_js(options))
            await fs.idb.set(path, handler)

    mounted[path] = await interpreter.mountNativeFS(path, handler)

async def sync(path):
    await mounted[path].syncfs()
