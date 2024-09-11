from polyscript import storage as _storage
from pyscript.flatted import parse as _parse
from pyscript.flatted import stringify as _stringify


# convert a Python value into an IndexedDB compatible entry
def _to_idb(value):
    if value is None:
        return _stringify(["null", 0])
    if isinstance(value, (bool, float, int, str, list, dict, tuple)):
        return _stringify(["generic", value])
    if isinstance(value, bytearray):
        return _stringify(["bytearray", [v for v in value]])
    if isinstance(value, memoryview):
        return _stringify(["memoryview", [v for v in value]])
    raise TypeError(f"Unexpected value: {value}")


# convert an IndexedDB compatible entry into a Python value
def _from_idb(value):
    (
        kind,
        result,
    ) = _parse(value)
    if kind == "null":
        return None
    if kind == "generic":
        return result
    if kind == "bytearray":
        return bytearray(result)
    if kind == "memoryview":
        return memoryview(bytearray(result))
    return value


class Storage(dict):
    def __init__(self, store):
        super().__init__({k: _from_idb(v) for k, v in store.entries()})
        self.__store__ = store

    def __delitem__(self, attr):
        self.__store__.delete(attr)
        super().__delitem__(attr)

    def __setitem__(self, attr, value):
        self.__store__.set(attr, _to_idb(value))
        super().__setitem__(attr, value)

    def clear(self):
        self.__store__.clear()
        super().clear()

    async def sync(self):
        await self.__store__.sync()


async def storage(name="", storage_class=Storage):
    if not name:
        raise ValueError("The storage name must be defined")
    return storage_class(await _storage(f"@pyscript/{name}"))
