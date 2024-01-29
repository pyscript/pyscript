from pyodide.ffi import create_proxy
from pyweb import media, pydom

from pyscript import display, document, when, window

devicesSelect = pydom["#devices"][0]
video = pydom["video"][0]
devices = {}


async def list_media_devices(event=None):
    """List the available media devices."""
    global devices
    for i, device in enumerate(await media.list_devices()):
        devices[device.id] = device
        label = f"{i} - ({device.kind}) {device.label} [{device.id}]"
        devicesSelect.options.add(value=device.id, html=label)


@when("click", "#pick-device")
async def connect_to_device(e):
    """Connect to the selected device."""
    device = devices[devicesSelect.value]
    video._js.srcObject = await device.get_stream()


@when("click", "#snap")
async def camera_click(e):
    """Take a picture and download it."""
    video.snap().download()


await list_media_devices()
