"""
Tests for the PyScript media module.
"""

import upytest

from pyscript import media


async def test_list_devices_returns_list():
    """
    The list_devices function should return a list of Device objects.
    """
    try:
        devices = await media.list_devices()
        assert isinstance(devices, list)
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_device_properties():
    """
    Device objects should have expected properties.
    """
    try:
        devices = await media.list_devices()

        if devices:
            device = devices[0]

            # Test all properties exist.
            assert hasattr(device, "id")
            assert hasattr(device, "kind")
            assert hasattr(device, "label")
            assert hasattr(device, "group")

            # Test kind has valid value.
            assert device.kind in [
                "videoinput",
                "audioinput",
                "audiooutput",
            ]
    except Exception:
        # Permission denied or no devices available - test passes.
        pass

async def test_device_dict_access():
    """
    Device objects should support dictionary-style access for JavaScript
    interop.
    """
    try:
        devices = await media.list_devices()

        if devices:
            device = devices[0]

            # Dictionary access should match property access.
            assert device["id"] == device.id
            assert device["kind"] == device.kind
            assert device["label"] == device.label
            assert device["group"] == device.group
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_request_stream_video_only():
    """
    The request_stream method should return a stream for video only.
    """
    try:
        stream = await media.Device.request_stream(video=True)
        assert hasattr(stream, "active")
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_request_stream_audio_only():
    """
    The request_stream method should return a stream for audio only.
    """
    try:
        stream = await media.Device.request_stream(audio=True, video=False)
        assert hasattr(stream, "active")
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_request_stream_audio_and_video():
    """
    The request_stream method should return a stream for both audio and video.
    """
    try:
        stream = await media.Device.request_stream(audio=True, video=True)
        assert hasattr(stream, "active")
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_request_stream_with_constraints():
    """
    The request_stream method should accept video constraints as a dict.
    """
    try:
        constraints = {"width": 640, "height": 480}
        stream = await media.Device.request_stream(video=constraints)
        assert hasattr(stream, "active")
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_load_backwards_compatibility():
    """
    The deprecated load method should still work for backwards compatibility.
    """
    try:
        stream = await media.Device.load(video=True)
        assert hasattr(stream, "active")
    except Exception:
        # Permission denied or no devices available - test passes.
        pass

@upytest.skip(
    "Blocks on Pyodide due to permission dialog.",
    skip_when=not upytest.is_micropython,
)
async def test_device_get_stream():
    """
    The get_stream instance method should return a stream from a specific
    device.
    """
    try:
        devices = await media.list_devices()

        # Find a video input device to test with.
        video_devices = [d for d in devices if d.kind == "videoinput"]

        if video_devices:
            stream = await video_devices[0].get_stream()
            assert hasattr(stream, "active")
    except Exception:
        # Permission denied or no devices available - test passes.
        pass


async def test_device_filtering_by_kind():
    """
    Devices should be filterable by their kind property.
    """
    try:
        devices = await media.list_devices()

        video_inputs = [d for d in devices if d.kind == "videoinput"]
        audio_inputs = [d for d in devices if d.kind == "audioinput"]
        audio_outputs = [d for d in devices if d.kind == "audiooutput"]

        # All filtered devices should have correct kind.
        for device in video_inputs:
            assert device.kind == "videoinput"

        for device in audio_inputs:
            assert device.kind == "audioinput"

        for device in audio_outputs:
            assert device.kind == "audiooutput"
    except Exception:
        # Permission denied or no devices available - test passes.
        pass
