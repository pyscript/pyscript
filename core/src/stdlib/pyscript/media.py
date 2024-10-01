from pyscript import window
from pyscript.ffi import to_js


class Device:
    """Device represents a media input or output device, such as a microphone,
    camera, or headset.
    """

    def __init__(self, device):
        self._dom_element = device

    @property
    def id(self):
        return self._dom_element.deviceId

    @property
    def group(self):
        return self._dom_element.groupId

    @property
    def kind(self):
        return self._dom_element.kind

    @property
    def label(self):
        return self._dom_element.label

    def __getitem__(self, key):
        return getattr(self, key)

    @classmethod
    async def load(cls, audio=False, video=True):
        """Load the device stream."""
        options = window.Object.new()
        options.audio = audio
        if isinstance(video, bool):
            options.video = video
        else:
            # TODO: Think this can be simplified but need to check it on the pyodide side

            # TODO: this is pyodide specific. shouldn't be!
            options.video = window.Object.new()
            for k in video:
                setattr(options.video, k, to_js(video[k]))

        stream = await window.navigator.mediaDevices.getUserMedia(options)
        return stream

    async def get_stream(self):
        key = self.kind.replace("input", "").replace("output", "")
        options = {key: {"deviceId": {"exact": self.id}}}

        return await self.load(**options)


async def list_devices() -> list[dict]:
    """
    Return the list of the currently available media input and output devices,
    such as microphones, cameras, headsets, and so forth.

    Output:

        list(dict) - list of dictionaries representing the available media devices.
            Each dictionary has the following keys:
            * deviceId: a string that is an identifier for the represented device
                that is persisted across sessions. It is un-guessable by other
                applications and unique to the origin of the calling application.
                It is reset when the user clears cookies (for Private Browsing, a
                different identifier is used that is not persisted across sessions).

            * groupId: a string that is a group identifier. Two devices have the same
                group identifier if they belong to the same physical device — for
                example a monitor with both a built-in camera and a microphone.

            * kind: an enumerated value that is either "videoinput", "audioinput"
                or "audiooutput".

            * label: a string describing this device (for example "External USB
                Webcam").

    Note: the returned list will omit any devices that are blocked by the document
    Permission Policy: microphone, camera, speaker-selection (for output devices),
    and so on. Access to particular non-default devices is also gated by the
    Permissions API, and the list will omit devices for which the user has not
    granted explicit permission.
    """
    # https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
    return [
        Device(obj) for obj in await window.navigator.mediaDevices.enumerateDevices()
    ]
