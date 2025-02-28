""""
Tests for the PyScript media module.

"""

from pyscript import media
import upytest


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
def test_module_structure():
    """Test that the media module has the expected structure and classes."""
    # Check module has expected attributes
    assert hasattr(media, "Device"), "media module should have Device class"
    assert hasattr(
        media, "list_devices"
    ), "media module should have list_devices function"


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
def test_device_class_structure():
    """Test that the Device class has the expected methods and class methods."""
    # Check Device class has expected methods
    assert hasattr(media.Device, "load"), "Device should have load class method"

    # Create a minimal mock Device for structure testing
    device_attrs = {
        "deviceId": "test-id",
        "groupId": "test-group",
        "kind": "videoinput",
        "label": "Test Device",
    }
    mock_dom = type("MockDOM", (), device_attrs)
    device = media.Device(mock_dom)

    # Test instance methods and properties
    assert hasattr(device, "id"), "Device should have id property"
    assert hasattr(device, "group"), "Device should have group property"
    assert hasattr(device, "kind"), "Device should have kind property"
    assert hasattr(device, "label"), "Device should have label property"
    assert hasattr(device, "get_stream"), "Device should have get_stream method"

    # Test property values
    assert device.id == "test-id", "Device id should match dom element"
    assert device.group == "test-group", "Device group should match dom element"
    assert device.kind == "videoinput", "Device kind should match dom element"
    assert device.label == "Test Device", "Device label should match dom element"


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
def test_device_getitem():
    """Test dictionary-style access to Device properties."""
    # Create a minimal mock Device
    device_attrs = {
        "deviceId": "test-id",
        "groupId": "test-group",
        "kind": "videoinput",
        "label": "Test Device",
    }
    mock_dom = type("MockDOM", (), device_attrs)
    device = media.Device(mock_dom)

    # Test __getitem__ access
    assert device["id"] == "test-id", "Device['id'] should access id property"
    assert (
        device["group"] == "test-group"
    ), "Device['group'] should access group property"
    assert device["kind"] == "videoinput", "Device['kind'] should access kind property"
    assert (
        device["label"] == "Test Device"
    ), "Device['label'] should access label property"


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
async def test_list_devices():
    """Test that list_devices returns a list of Device objects."""
    devices = await media.list_devices()
    assert isinstance(devices, list), "list_devices should return a list"

    # We don't assert on the number of devices since that's environment-dependent
    if devices:
        device = devices[0]
        assert hasattr(device, "id"), "Device should have id property"
        assert hasattr(device, "group"), "Device should have group property"
        assert hasattr(device, "kind"), "Device should have kind property"
        assert hasattr(device, "label"), "Device should have label property"


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
async def test_device_load():
    """Test that Device.load returns a media stream."""
    stream = await media.Device.load(video=True)
    assert hasattr(stream, "active"), "Stream should have active property"


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
def test_required_browser_objects():
    """Test that the required browser integration points exist for the media module."""
    assert hasattr(media, "window"), "media module should have window reference"
    assert hasattr(media.window, "navigator"), "window.navigator should exist"
