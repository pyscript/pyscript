"""
Tests for the pyscript.storage module.
"""

from pyscript import Storage, storage

test_store = None


async def setup():
    """
    Set up a clean test storage before each test.
    """
    global test_store
    if test_store is None:
        test_store = await storage("test_store")
    test_store.clear()
    await test_store.sync()


async def teardown():
    """
    Clean up test storage after each test.
    """
    if test_store:
        test_store.clear()
        await test_store.sync()


async def test_storage_as_dict():
    """
    The storage object should behave as a Python dict.
    """
    # Assign.
    test_store["a"] = 1
    # Retrieve.
    assert test_store["a"] == 1
    assert "a" in test_store
    assert len(test_store) == 1
    # Iterate.
    for k, v in test_store.items():
        assert k == "a"
        assert v == 1
    # Remove.
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


async def test_storage_get_method():
    """
    The get method should return default value for missing keys.
    """
    test_store["exists"] = "value"

    assert test_store.get("exists") == "value"
    assert test_store.get("missing") is None
    assert test_store.get("missing", "default") == "default"


async def test_storage_keys_values_items():
    """
    The keys, values, and items methods should work like dict.
    """
    test_store["a"] = 1
    test_store["b"] = 2
    test_store["c"] = 3

    assert set(test_store.keys()) == {"a", "b", "c"}
    assert set(test_store.values()) == {1, 2, 3}
    assert set(test_store.items()) == {("a", 1), ("b", 2), ("c", 3)}


async def test_storage_update():
    """
    The update method should add multiple items at once.
    """
    test_store["a"] = 1

    # Update with dict.
    test_store.update({"b": 2, "c": 3})
    assert test_store["b"] == 2
    assert test_store["c"] == 3

    # Update with keyword arguments.
    test_store.update(d=4, e=5)
    assert test_store["d"] == 4
    assert test_store["e"] == 5


async def test_storage_pop():
    """
    The pop method should remove and return values.
    """
    test_store["a"] = 1
    test_store["b"] = 2

    value = test_store.pop("a")
    assert value == 1
    assert "a" not in test_store
    assert len(test_store) == 1

    # Pop with default.
    value = test_store.pop("missing", "default")
    assert value == "default"


async def test_storage_persistence():
    """
    Data should persist after sync and reload.
    """
    test_store["persistent"] = "value"
    await test_store.sync()

    # Reload the same storage.
    reloaded = await storage("test_store")
    assert reloaded["persistent"] == "value"


async def test_storage_nested_structures():
    """
    Nested data structures should be stored and retrieved correctly.
    """
    nested = {
        "level1": {"level2": {"level3": [1, 2, 3]}},
        "list_of_dicts": [{"a": 1}, {"b": 2}, {"c": 3}],
    }

    test_store["nested"] = nested
    await test_store.sync()

    retrieved = test_store["nested"]
    assert retrieved["level1"]["level2"]["level3"] == [1, 2, 3]
    assert retrieved["list_of_dicts"][0]["a"] == 1


async def test_storage_overwrite():
    """
    Overwriting values should work correctly.
    """
    test_store["key"] = "original"
    assert test_store["key"] == "original"

    test_store["key"] = "updated"
    assert test_store["key"] == "updated"


async def test_storage_empty_string_key():
    """
    Empty strings should be valid keys.
    """
    test_store[""] = "empty key"
    assert "" in test_store
    assert test_store[""] == "empty key"


async def test_storage_special_characters_in_keys():
    """
    Keys with special characters should work.
    """
    test_store["key with spaces"] = 1
    test_store["key-with-dashes"] = 2
    test_store["key.with.dots"] = 3
    test_store["key/with/slashes"] = 4

    assert test_store["key with spaces"] == 1
    assert test_store["key-with-dashes"] == 2
    assert test_store["key.with.dots"] == 3
    assert test_store["key/with/slashes"] == 4


async def test_storage_multiple_stores():
    """
    Multiple named storages should be independent.
    """
    store1 = await storage("store1")
    store2 = await storage("store2")

    store1.clear()
    store2.clear()

    store1["key"] = "value1"
    store2["key"] = "value2"

    assert store1["key"] == "value1"
    assert store2["key"] == "value2"

    # Clean up.
    store1.clear()
    store2.clear()
    await store1.sync()
    await store2.sync()


async def test_storage_empty_name_raises():
    """
    Creating storage with empty name should raise ValueError.
    """
    try:
        await storage("")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "non-empty" in str(e)


async def test_custom_storage_class():
    """
    Custom Storage subclasses should work correctly.
    """
    calls = []

    class TrackingStorage(Storage):
        def __setitem__(self, key, value):
            calls.append(("set", key, value))
            super().__setitem__(key, value)

        def __delitem__(self, key):
            calls.append(("del", key))
            super().__delitem__(key)

    custom_store = await storage("custom_test", storage_class=TrackingStorage)
    custom_store.clear()
    calls.clear()

    # Test setitem tracking.
    custom_store["test"] = 123
    assert ("set", "test", 123) in calls
    assert custom_store["test"] == 123

    # Test delitem tracking.
    del custom_store["test"]
    assert ("del", "test") in calls

    # Clean up.
    custom_store.clear()
    await custom_store.sync()


async def test_storage_boolean_false_vs_none():
    """
    False and None should be distinguishable.
    """
    test_store["false"] = False
    test_store["none"] = None

    assert test_store["false"] is False
    assert test_store["false"] is not None
    assert test_store["none"] is None
    assert test_store["none"] is not False


async def test_storage_numeric_zero_vs_none():
    """
    Zero and None should be distinguishable.
    """
    test_store["zero_int"] = 0
    test_store["zero_float"] = 0.0
    test_store["none"] = None

    assert test_store["zero_int"] == 0
    assert test_store["zero_int"] is not None
    assert test_store["zero_float"] == 0.0
    assert test_store["zero_float"] is not None
    assert test_store["none"] is None


async def test_storage_empty_collections():
    """
    Empty lists and dicts should be stored correctly.
    """
    test_store["empty_list"] = []
    test_store["empty_dict"] = {}

    assert test_store["empty_list"] == []
    assert isinstance(test_store["empty_list"], list)
    assert test_store["empty_dict"] == {}
    assert isinstance(test_store["empty_dict"], dict)
