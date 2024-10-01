from pyscript import display, document, media, when, window
from pyscript.web import page

devicesSelect = page["#devices"][0]
video = page["video"][0]
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
    video.srcObject = await device.get_stream()


@when("click", "#snap")
async def camera_click(e):
    """Take a picture and download it."""
    video.snap().download()


await list_media_devices()
