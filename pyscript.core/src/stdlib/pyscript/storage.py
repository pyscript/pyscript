from polyscript import storage as _storage
from pyscript.flatted import parse, stringify


# convert a Python value into an IndexedDB compatible entry
def to_idb(value):
    if value is None:
        return stringify(["null", 0])
    if isinstance(value, (float, int, str, list, dict, tuple)):
        return stringify(["generic", value])
    if isinstance(value, bytearray):
        return stringify(["bytearray", [v for v in value]])
    if isinstance(value, memoryview):
        return stringify(["memoryview", [v for v in value]])
    raise f"Unexpected value: {value}"


# convert an IndexedDB compatible entry into a Python value
def from_idb(value):
    (
        kind,
        result,
    ) = parse(value)
    if kind == "null":
        return None
    if kind == "generic":
        return result
    if kind == "bytearray":
        return bytearray(result)
    if kind == "memoryview":
        return memoryview(bytearray(result))
    return value


async def storage(*args):
    if len(args):
        (name,) = args
    else:
        name = "core"

    store = await _storage(f"@pyscript/{name}")
    known = {k: from_idb(v) for k, v in store.entries()}

    class Storage(dict):
        def __init__(self, known):
            super().__init__(known)

        def __delitem__(self, attr):
            store.delete(attr)
            super().__delitem__(attr)

        def __setitem__(self, attr, value):
            store.set(attr, to_idb(value))
            super().__setitem__(attr, value)

        def clear(self):
            store.clear()
            super().clear()

        async def sync(self):
            await store.sync()

    return Storage(known)
