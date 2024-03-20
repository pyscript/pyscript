import json, js

def _as_bytearray(buffer):
    ui8a = js.Uint8Array.new(buffer)
    size = ui8a.length
    ba = bytearray(size)
    for i in range(0, size):
        ba[i] = ui8a[i]
    return ba

### wrap the response to grant Pythonic results
class _Response:
    def __init__(self, response):
        self._response = response

    # forward response.ok and others
    def __getattr__(self, attr):
        return getattr(self._response, attr)

    # exposed methods with Pythonic results
    async def arrayBuffer(self):
        buffer = await self._response.arrayBuffer()
        # works in Pyodide
        if hasattr(buffer, "to_py"):
            return buffer.to_py()
        # shims in MicroPython
        return memoryview(_as_bytearray(buffer))

    async def blob(self):
        return await self._response.blob()

    async def bytearray(self):
        buffer = await self._response.arrayBuffer()
        return _as_bytearray(buffer)

    async def json(self):
        return json.loads(await self.text())

    async def text(self):
        return await self._response.text()


async def fetch(url, **kw):
    # workaround Pyodide / MicroPython dict <-> js conversion
    options = js.JSON.parse(json.dumps(kw))
    response = await js.fetch(url, options)
    return _Response(response)
