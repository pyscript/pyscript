import json

import upytest
from pyscript import web

result = await upytest.run("./tests")  # /test_web.py::TestElements.test_img")
output = web.div(json.dumps(result), id="result")
web.page.append(output)
