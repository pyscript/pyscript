import js

js.document.body.append("document patch ")

import a

from pyscript import RUNNING_IN_WORKER, display, sync

display("Hello World", target="test", append=True)

print(RUNNING_IN_WORKER)
print("sleeping")
sync.sleep(1)
print("awake")
