from pyodide.ffi import create_proxy
from pyscript import display, document, when, window
from pyweb import media, pydom

devicesSelect = pydom["#devices"][0]
video = pydom["video"][0]
devices = {}


async def list_media_devices(event=None):
    global devices
    for i, device in enumerate(await media.list_devices()):
        devices[device.id] = device
        label = f"{i} - ({device.kind}) {device.label} [{device.id}]"
        devicesSelect.options.add(value=device.id, html=label)


@when("click", "#pick-device")
async def connect_to_device(e):
    device = devices[devicesSelect.value]
    video._js.srcObject = await device.get_stream()


@when("click", "#snap")
async def camera_click(e):
    video.snap().download()

await list_media_devices()
