import json

import js


### wrap the response to grant Pythonic results
class _Response:
    def __init__(self, response):
        self._response = response

    # grant access to response.ok and other fields
    def __getattr__(self, attr):
        return getattr(self._response, attr)

    def _as_bytearray(self, buffer):
        ui8a = js.Uint8Array.new(buffer)
        size = ui8a.length
        ba = bytearray(size)
        for i in range(0, size):
            ba[i] = ui8a[i]
        return ba

    # exposed methods with Pythonic results
    async def arrayBuffer(self):
        buffer = await self._response.arrayBuffer()
        # works in Pyodide
        if hasattr(buffer, "to_py"):
            return buffer.to_py()
        # shims in MicroPython
        return memoryview(self._as_bytearray(buffer))

    async def blob(self):
        return await self._response.blob()

    async def bytearray(self):
        buffer = await self._response.arrayBuffer()
        return self._as_bytearray(buffer)

    async def json(self):
        return json.loads(await self.text())

    async def text(self):
        return await self._response.text()


async def fetch(url, **kw):
    # workaround Pyodide / MicroPython dict <-> js conversion
    options = js.JSON.parse(json.dumps(kw))
    response = await js.fetch(url, options)
    return _Response(response)
