from pyscript import web
import upytest
import json

result = await upytest.run("./tests") #/test_web.py::TestElements.test_img")
output = web.div(json.dumps(result), id="result")
web.page.append(output)
