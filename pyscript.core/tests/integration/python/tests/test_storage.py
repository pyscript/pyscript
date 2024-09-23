"""
Ensure the pyscript.storage object behaves as a Python dict.
"""

from pyscript import Storage, storage

test_store = None


async def setup():
    global test_store
    if test_store is None:
        test_store = await storage("test_store")
    test_store.clear()
    await test_store.sync()


async def teardown():
    if test_store:
        test_store.clear()
        await test_store.sync()


async def test_storage_as_dict():
    """
    The storage object should behave as a Python dict.
    """
    # Assign
    test_store["a"] = 1
    # Retrieve
    assert test_store["a"] == 1
    assert "a" in test_store
    assert len(test_store) == 1
    # Iterate
    for k, v in test_store.items():
        assert k == "a"
        assert v == 1
    # Remove
    del test_store["a"]
    assert "a" not in test_store
    assert len(test_store) == 0


async def test_storage_types():
    """
    The storage object should support different types of values.
    """
    test_store["boolean"] = False
    test_store["integer"] = 42
    test_store["float"] = 3.14
    test_store["string"] = "hello"
    test_store["none"] = None
    test_store["list"] = [1, 2, 3]
    test_store["dict"] = {"a": 1, "b": 2}
    test_store["tuple"] = (1, 2, 3)
    test_store["bytearray"] = bytearray(b"hello")
    test_store["memoryview"] = memoryview(b"hello")
    await test_store.sync()
    assert test_store["boolean"] is False
    assert isinstance(test_store["boolean"], bool)
    assert test_store["integer"] == 42
    assert isinstance(test_store["integer"], int)
    assert test_store["float"] == 3.14
    assert isinstance(test_store["float"], float)
    assert test_store["string"] == "hello"
    assert isinstance(test_store["string"], str)
    assert test_store["none"] is None
    assert isinstance(test_store["none"], type(None))
    assert test_store["list"] == [1, 2, 3]
    assert isinstance(test_store["list"], list)
    assert test_store["dict"] == {"a": 1, "b": 2}
    assert isinstance(test_store["dict"], dict)
    assert test_store["tuple"] == (1, 2, 3)
    assert isinstance(test_store["tuple"], tuple)
    assert test_store["bytearray"] == bytearray(b"hello")
    assert isinstance(test_store["bytearray"], bytearray)
    assert test_store["memoryview"] == memoryview(b"hello")
    assert isinstance(test_store["memoryview"], memoryview)


async def test_storage_clear():
    """
    The clear method should remove all items from the storage object.
    """
    test_store["a"] = 1
    test_store["b"] = 2
    assert len(test_store) == 2
    test_store.clear()
    assert len(test_store) == 0
