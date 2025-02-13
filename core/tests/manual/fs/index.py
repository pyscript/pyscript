import os
from pyscript import RUNNING_IN_WORKER, fs


TEST = "implicit"

if TEST == "implicit":
    await fs.mount("/persistent")

    print(
        RUNNING_IN_WORKER and "Worker" or "Main",
        os.listdir("/persistent"),
    )

    from random import random

    with open("/persistent/random.txt", "w") as f:
        f.write(str(random()))

    await fs.sync("/persistent")

elif not RUNNING_IN_WORKER:
    from pyscript import document

    explicit = document.createElement("button")
    explicit.textContent = "grant access"
    document.body.append(explicit)

    async def mount(event):
        try:
            await fs.mount("/persistent")
            print(os.listdir("/persistent"))
            explicit.disabled = True
        except:
            import js

            js.alert("unable to grant access")

    explicit.onclick = mount
