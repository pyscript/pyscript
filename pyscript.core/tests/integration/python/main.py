from pyscript import web
import upytest
import json

result = await upytest.run("./tests")
output = web.div(json.dumps(result), id="result")
web.page.append(output)
