import js

js.document.body.append("document patch ")

import a
from pyscript import window, display, sync

display("Hello World", target="test", append=True)

print(window is not js)
print("sleeping")
sync.sleep(1)
print("awake")
