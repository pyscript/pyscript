import js

js.document.body.append("document patch ")

import a
from pyscript import display, sync, window

display("Hello World", target="test", append=True)

print(window is not js)
print("sleeping")
sync.sleep(1)
print("awake")
