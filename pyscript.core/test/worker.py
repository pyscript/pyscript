import a

from pyscript import display, sync

display("Hello World", target="test", append=True)

print("sleeping")
sync.sleep(1)
print("awake")

import js

js.document.body.append("document patch ")
