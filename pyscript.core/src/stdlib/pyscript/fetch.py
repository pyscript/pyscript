import json

import js
from pyscript.util import as_bytearray


### wrap the response to grant Pythonic results
class _Response:
    def __init__(self, response):
        self._response = response

    # grant access to response.ok and other fields
    def __getattr__(self, attr):
        return getattr(self._response, attr)

    # exposed methods with Pythonic results
    async def arrayBuffer(self):
        buffer = await self._response.arrayBuffer()
        # works in Pyodide
        if hasattr(buffer, "to_py"):
            return buffer.to_py()
        # shims in MicroPython
        return memoryview(as_bytearray(buffer))

    async def blob(self):
        return await self._response.blob()

    async def bytearray(self):
        buffer = await self._response.arrayBuffer()
        return as_bytearray(buffer)

    async def json(self):
        return json.loads(await self.text())

    async def text(self):
        return await self._response.text()


### allow direct await to _Response methods
class _DirectResponse:
    @staticmethod
    def setup(promise, response):
        promise._response = _Response(response)
        return promise._response

    def __init__(self, promise):
        self._promise = promise
        promise._response = None
        promise.arrayBuffer = self.arrayBuffer
        promise.blob = self.blob
        promise.bytearray = self.bytearray
        promise.json = self.json
        promise.text = self.text

    async def _response(self):
        if not self._promise._response:
            await self._promise
        return self._promise._response

    async def arrayBuffer(self):
        response = await self._response()
        return await response.arrayBuffer()

    async def blob(self):
        response = await self._response()
        return await response.blob()

    async def bytearray(self):
        response = await self._response()
        return await response.bytearray()

    async def json(self):
        response = await self._response()
        return await response.json()

    async def text(self):
        response = await self._response()
        return await response.text()


def fetch(url, **kw):
    # workaround Pyodide / MicroPython dict <-> js conversion
    options = js.JSON.parse(json.dumps(kw))
    awaited = lambda response, *args: _DirectResponse.setup(promise, response)
    promise = js.fetch(url, options).then(awaited)
    _DirectResponse(promise)
    return promise
