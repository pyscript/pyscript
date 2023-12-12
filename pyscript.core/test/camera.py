import random
from datetime import datetime as dt

from pyscript import display, when, window
from pyweb import pydom, media
# from pyweb.base import when


devicesSelect = pydom['#devices'][0]

@when("click", "#list-devices")
async def list_media_devices(event):
    devices = await media.list_devices()
    display(f"Devices found {len(devices)}", append=False, target="result")

    keys = ['deviceId', 'groupId', 'kind', 'label']

    for i, device in enumerate(devices):
        value = device
        label = f"{i} - ({device.kind}) {device.label} [{device.id}]"
        display(label, append=True, target="result")

        devicesSelect.options.add(value=value, html=label)

@when("click", "#pick-device")
async def connect_to_device(e):
    print(devicesSelect.value)
