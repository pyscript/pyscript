from pyscript import window
from pyscript.ffi import to_js

import upytest

result = await upytest.run("./tests")
window.console.log(to_js(result))