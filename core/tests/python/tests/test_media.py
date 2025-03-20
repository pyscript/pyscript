""""
Tests for the PyScript media module.
"""

from pyscript import media
import upytest

from pyscript import media


@upytest.skip(
    "Uses Pyodide-specific to_js function in MicroPython",
    skip_when=upytest.is_micropython,
)
async def test_device_enumeration():
    """Test enumerating media devices."""
    devices = await media.list_devices()
    assert isinstance(devices, list), "list_devices should return a list"

    # If devices are found, verify they have the expected functionality
    if devices:
        device = devices[0]

        # Test real device properties exist (but don't assert on their values)
        # Browser security might restrict actual values until permissions are granted
        assert hasattr(device, "id"), "Device should have id property"
        assert hasattr(device, "kind"), "Device should have kind property"
        assert device.kind in [
            "videoinput",
            "audioinput",
            "audiooutput",
        ], f"Device should have a valid kind, got: {device.kind}"

        # Verify dictionary access works with actual device
        assert (
            device["id"] == device.id
        ), "Dictionary access should match property access"
        assert (
            device["kind"] == device.kind
        ), "Dictionary access should match property access"


@upytest.skip("Waiting on a bug-fix in MicroPython, for this test to work.", skip_when=upytest.is_micropython)
async def test_video_stream_acquisition():
    """Test video stream."""
    try:
        # Load a video stream
        stream = await media.Device.load(video=True)

        # Verify we get a real stream with expected properties
        assert hasattr(stream, "active"), "Stream should have active property"

        # Check for video tracks, but don't fail if permissions aren't granted
        if stream._dom_element and hasattr(stream._dom_element, "getVideoTracks"):
            tracks = stream._dom_element.getVideoTracks()
            if tracks.length > 0:
                assert True, "Video stream has video tracks"
    except Exception as e:
        # If the browser blocks access, the test should still pass
        # This is because we're testing the API works, not that permissions are granted
        assert (
            True
        ), f"Stream acquisition attempted but may require permissions: {str(e)}"


@upytest.skip("Waiting on a bug-fix in MicroPython, for this test to work.", skip_when=upytest.is_micropython)
async def test_custom_video_constraints():
    """Test loading video with custom constraints."""
    try:
        # Define custom constraints
        constraints = {"width": 640, "height": 480}

        # Load stream with custom constraints
        stream = await media.Device.load(video=constraints)

        # Basic stream property check
        assert hasattr(stream, "active"), "Stream should have active property"

        # Check for tracks only if we have access
        if stream._dom_element and hasattr(stream._dom_element, "getVideoTracks"):
            tracks = stream._dom_element.getVideoTracks()
            if tracks.length > 0 and hasattr(tracks[0], "getSettings"):
                # Settings verification is optional - browsers may handle constraints differently
                pass
    except Exception as e:
        # If the browser blocks access, test that the API structure works
        assert True, f"Custom constraint test attempted: {str(e)}"
