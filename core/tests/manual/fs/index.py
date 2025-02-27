import os
from pyscript import RUNNING_IN_WORKER, fs


TEST = "implicit"

if TEST == "implicit":
    await fs.mount("/persistent")

    print(
        (RUNNING_IN_WORKER and "Worker") or "Main",
        os.listdir("/persistent"),
    )

    from random import random

    with open("/persistent/random.txt", "w") as f:
        f.write(str(random()))

    await fs.sync("/persistent")

elif not RUNNING_IN_WORKER:
    from pyscript import document

    button = document.createElement("button")
    button.textContent = "mount"
    document.body.append(button)

    async def mount(event):
        try:
            await fs.mount("/persistent")
            print(os.listdir("/persistent"))
            button.textContent = "unmount"
            button.onclick = unmount

        except:
            import js

            js.alert("unable to grant access")

    async def unmount(event):
        await fs.unmount("/persistent")
        button.textContent = "mount"
        button.onclick = mount

    button.onclick = mount
