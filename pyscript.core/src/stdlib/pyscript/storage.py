from polyscript import storage as _storage

async def storage(*args):
    if len(args):
        name, = args
    else:
        name = "core"

    store = await _storage(f"@pyscript/{name}")

    known = {}
    for k, v in store.entries():
        known[k] = v

    class Storage(dict):
        def __init__(self, known):
            super().__init__(known)

        def __delitem__(self, attr):
            store.delete(attr)
            super().__delitem__(attr)

        def __setitem__(self, attr, value):
            store.set(attr, value)
            super().__setitem__(attr, value)

        # These won't be reflected on the `len(self)`
        # TBD: do we want these at all?

        # def __delattr__(self, attr):
        #     store.delete(attr)
        #     super().__delattr__(attr)

        # def __getattr__(self, attr):
        #     return store.get(attr)

        # def __setattr__(self, attr, value):
        #     store.set(attr, value)
        #     super().__setattr__(attr, value)

        def clear(self):
            store.clear()
            super().clear()

        async def sync(self):
            await store.sync()

    return Storage(known)
