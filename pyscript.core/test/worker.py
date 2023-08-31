from pyscript import display, sync

import a

display("Hello World", target="test", append=True)

print("sleeping")
sync.sleep(1)
print("awake")
