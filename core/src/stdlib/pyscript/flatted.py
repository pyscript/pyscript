"""
This module is a Python implementation of the
[Flatted JavaScript library](https://www.npmjs.com/package/flatted), which
provides a light and fast way to serialize and deserialize JSON structures
that contain circular references.

Standard JSON cannot handle circular references - attempting to serialize an
object that references itself will cause an error. Flatted solves this by
transforming circular structures into a flat array format that can be safely
serialized and later reconstructed.

Common use cases:

- Serializing complex object graphs with circular references.
- Working with DOM-like structures that contain parent/child references.
- Preserving object identity when serializing data structures.

```python
from pyscript import flatted


# Create a circular structure.
obj = {"name": "parent"}
obj["self"] = obj  # Circular reference!

# Standard json.dumps would fail here.
serialized = flatted.stringify(obj)

# Reconstruct the original structure.
restored = flatted.parse(serialized)
assert restored["self"] is restored  # Circular reference preserved!
```
"""

import json as _json


class _Known:
    def __init__(self):
        self.key = []
        self.value = []


class _String:
    def __init__(self, value):
        self.value = value


def _array_keys(value):
    keys = []
    i = 0
    for _ in value:
        keys.append(i)
        i += 1
    return keys


def _object_keys(value):
    keys = []
    for key in value:
        keys.append(key)
    return keys


def _is_array(value):
    return isinstance(value, (list, tuple))


def _is_object(value):
    return isinstance(value, dict)


def _is_string(value):
    return isinstance(value, str)


def _index(known, input, value):
    input.append(value)
    index = str(len(input) - 1)
    known.key.append(value)
    known.value.append(index)
    return index


def _loop(keys, input, known, output):
    for key in keys:
        value = output[key]
        if isinstance(value, _String):
            _ref(key, input[int(value.value)], input, known, output)

    return output


def _ref(key, value, input, known, output):
    if _is_array(value) and value not in known:
        known.append(value)
        value = _loop(_array_keys(value), input, known, value)
    elif _is_object(value) and value not in known:
        known.append(value)
        value = _loop(_object_keys(value), input, known, value)

    output[key] = value


def _relate(known, input, value):
    if _is_string(value) or _is_array(value) or _is_object(value):
        try:
            return known.value[known.key.index(value)]
        except:
            return _index(known, input, value)

    return value


def _transform(known, input, value):
    if _is_array(value):
        output = []
        for val in value:
            output.append(_relate(known, input, val))
        return output

    if _is_object(value):
        obj = {}
        for key in value:
            obj[key] = _relate(known, input, value[key])
        return obj

    return value


def _wrap(value):
    if _is_string(value):
        return _String(value)

    if _is_array(value):
        i = 0
        for val in value:
            value[i] = _wrap(val)
            i += 1

    elif _is_object(value):
        for key in value:
            value[key] = _wrap(value[key])

    return value


def parse(value, *args, **kwargs):
    """
    Parse a Flatted JSON string and reconstruct the original structure.

    This function takes a `value` containing a JSON string created by
    Flatted's stringify() and reconstructs the original Python object,
    including any circular references. The `*args` and `**kwargs` are passed
    to json.loads() for additional customization.

    ```python
    from pyscript import flatted


    # Parse a Flatted JSON string.
    json_string = '[{"name": "1", "self": "0"}, "parent"]'
    obj = flatted.parse(json_string)

    # Circular references are preserved.
    assert obj["self"] is obj
    ```
    """
    json = _json.loads(value, *args, **kwargs)
    wrapped = []
    for value in json:
        wrapped.append(_wrap(value))

    input = []
    for value in wrapped:
        if isinstance(value, _String):
            input.append(value.value)
        else:
            input.append(value)

    value = input[0]

    if _is_array(value):
        return _loop(_array_keys(value), input, [value], value)

    if _is_object(value):
        return _loop(_object_keys(value), input, [value], value)

    return value


def stringify(value, *args, **kwargs):
    """
    Serialize a Python object to a Flatted JSON string.

    This function converts `value`, a Python object (including those with
    circular references), into a JSON string that can be safely transmitted
    or stored. The resulting string can be reconstructed using Flatted's
    parse(). The `*args` and `**kwargs` are passed to json.dumps() for
    additional customization.

    ```python
    from pyscript import flatted


    # Create an object with a circular reference.
    parent = {"name": "parent", "children": []}
    child = {"name": "child", "parent": parent}
    parent["children"].append(child)

    # Serialize it (standard json.dumps would fail here).
    json_string = flatted.stringify(parent)

    # Can optionally pretty-print via JSON indentation etc.
    pretty = flatted.stringify(parent, indent=2)
    ```
    """
    known = _Known()
    input = []
    output = []
    i = int(_index(known, input, value))
    while i < len(input):
        output.append(_transform(known, input, input[i]))
        i += 1
    return _json.dumps(output, *args, **kwargs)
