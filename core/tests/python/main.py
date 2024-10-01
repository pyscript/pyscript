import json

import upytest

from pyscript import web

result = await upytest.run("./tests", random=True)
output = web.div(json.dumps(result), id="result")
web.page.append(output)
