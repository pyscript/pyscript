from pyscript import RUNNING_IN_WORKER, fs

await fs.mount("/persistent")

import os
print(
    RUNNING_IN_WORKER and "Worker" or "Main",
    os.listdir("/persistent"),
)

from random import random
with open("/persistent/random.txt", "w") as f:
    f.write(str(random()))
    f.close()

await fs.sync("/persistent")
