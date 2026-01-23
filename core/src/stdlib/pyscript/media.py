"""
This module provides classes and functions for interacting with
[media devices and streams](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API)
in the browser, enabling you to work with cameras, microphones,
and other media input/output devices directly from Python.

Use this module for:

- Accessing webcams for video capture.
- Recording audio from microphones.
- Enumerating available media devices.
- Applying constraints to media streams (resolution, frame rate, etc.).

```python
from pyscript import document
from pyscript.media import Device, list_devices


# Get a video stream from the default camera.
stream = await Device.request_stream(video=True)

# Display in a video element.
video = document.getElementById("my-video")
video.srcObject = stream

# Or list all available devices.
devices = await list_devices()
for device in devices:
    print(f"{device.kind}: {device.label}")
```

Using media devices requires user permission. Browsers will show a
permission dialog when accessing devices for the first time.
"""

from pyscript import window
from pyscript.ffi import to_js


class Device:
    """
    Represents a media input or output device.

    This class wraps a browser
    [MediaDeviceInfo object](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo),
    providing Pythonic access to device properties like `ID`, `label`, and
    `kind` (audio/video, input/output).

    Devices are typically obtained via the `list_devices()` function in this
    module, rather than constructed directly.

    ```python
    from pyscript.media import list_devices


    # Get all available devices.
    devices = await list_devices()

    # Find video input devices (cameras).
    cameras = [d for d in devices if d.kind == "videoinput"]

    # Get a stream from a specific camera.
    if cameras:
        stream = await cameras[0].get_stream()
    ```
    """

    def __init__(self, device):
        """
        Create a Device wrapper around a MediaDeviceInfo `device`.
        """
        self._device_info = device

    @property
    def id(self):
        """
        Unique identifier for this device.

        This `ID` persists across sessions but is reset when the user clears
        cookies. It's unique to the origin of the calling application.
        """
        return self._device_info.deviceId

    @property
    def group(self):
        """
        Group identifier for related devices.

        Devices belonging to the same physical device (e.g., a monitor with
        both a camera and microphone) share the same `group ID`.
        """
        return self._device_info.groupId

    @property
    def kind(self):
        """
        Device type: `"videoinput"`, `"audioinput"`, or `"audiooutput"`.
        """
        return self._device_info.kind

    @property
    def label(self):
        """
        Human-readable description of the device.

        Example: `"External USB Webcam"` or `"Built-in Microphone"`.
        """
        return self._device_info.label

    def __getitem__(self, key):
        """
        Support bracket notation for JavaScript interop.

        Allows accessing properties via `device["id"]` syntax. Necessary
        when Device instances are proxied to JavaScript.
        """
        return getattr(self, key)

    @classmethod
    async def request_stream(cls, audio=False, video=True):
        """
        Request a media stream with the specified constraints.

        This is a class method that requests access to media devices matching
        the given `audio` and `video` constraints. The browser will prompt the
        user for permission if needed and return a `MediaStream` object that
        can be assigned to video/audio elements.

        Simple boolean constraints for `audio` and `video` can be used to
        request default devices. More complex constraints can be specified as
        dictionaries conforming to
        [the MediaTrackConstraints interface](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints).

        ```python
        from pyscript import document
        from pyscript.media import Device


        # Get default video stream.
        stream = await Device.request_stream()

        # Get stream with specific constraints.
        stream = await Device.request_stream(
            video={"width": 1920, "height": 1080}
        )

        # Get audio and video.
        stream = await Device.request_stream(audio=True, video=True)

        # Use the stream.
        video_el = document.getElementById("camera")
        video_el.srcObject = stream
        ```

        This method will trigger a browser permission dialog on first use.
        """
        options = {}
        if isinstance(audio, bool):
            options["audio"] = audio
        elif isinstance(audio, dict):
            # audio is a dict of constraints (sampleRate, echoCancellation etc...).
            options["audio"] = audio
        if isinstance(video, bool):
            options["video"] = video
        elif isinstance(video, dict):
            # video is a dict of constraints (width, height etc...).
            options["video"] = video
        return await window.navigator.mediaDevices.getUserMedia(to_js(options))

    @classmethod
    async def load(cls, audio=False, video=True):
        """
        !!! warning
            **Deprecated: Use `request_stream()` instead.**

            This method is retained for backwards compatibility but will be
            removed in a future release. Please use `request_stream()` instead.
        """
        return await cls.request_stream(audio=audio, video=video)

    async def get_stream(self):
        """
        Get a media stream from this specific device.

        ```python
        from pyscript.media import list_devices


        # List all devices.
        devices = await list_devices()

        # Find a specific camera.
        my_camera = None
        for device in devices:
            if device.kind == "videoinput" and "USB" in device.label:
                my_camera = device
                break

        # Get a stream from that specific camera.
        if my_camera:
            stream = await my_camera.get_stream()
        ```

        This will trigger a permission dialog if the user hasn't already
        granted permission for this device type.
        """
        # Extract media type from device kind (e.g., "videoinput" -> "video").
        media_type = self.kind.replace("input", "").replace("output", "")
        # Request stream with exact device ID constraint.
        options = {media_type: {"deviceId": {"exact": self.id}}}
        return await self.request_stream(**options)


async def list_devices():
    """
    Returns a list of all media devices currently available to the browser,
    such as microphones, cameras, and speakers.

    ```python
    from pyscript.media import list_devices


    # Get all devices.
    devices = await list_devices()

    # Print device information.
    for device in devices:
        print(f"{device.kind}: {device.label} (ID: {device.id})")

    # Filter for specific device types.
    cameras = [d for d in devices if d.kind == "videoinput"]
    microphones = [d for d in devices if d.kind == "audioinput"]
    speakers = [d for d in devices if d.kind == "audiooutput"]
    ```

    The returned list will omit devices that are blocked by the document
    [Permission Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
    (microphone, camera, speaker-selection) or for
    which the user has not granted explicit permission.

    For security and privacy, device labels may be empty strings until
    permission is granted. See
    [this document](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices)
    for more information about this web standard.
    """
    device_infos = await window.navigator.mediaDevices.enumerateDevices()
    return [Device(device_info) for device_info in device_infos]
