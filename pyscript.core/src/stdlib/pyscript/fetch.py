import json

import js


def _as_bytearray(buffer):
    ui8a = js.Uint8Array.new(buffer)
    size = ui8a.length
    ba = bytearray(size)
    for i in range(0, size):
        ba[i] = ui8a[i]
    return ba


class _Fetch:
    def __init__(self, url, **kw):
        # avoid both Pyodide and MicroPython FFI
        options = js.JSON.parse(json.dumps(kw))
        self._url = url
        self._fetch = js.fetch(url, options)

    async def _arrayBuffer(self):
        response = await self._response()
        return await response.arrayBuffer()

    async def _response(self):
        response = await self._fetch
        if not response.ok:
            msg = f"URL {self._url} failed with status {response.status}"
            raise Exception(msg)
        return response

    # https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer
    # returns a memoryview of the buffer
    async def arrayBuffer(self):
        buffer = await self._arrayBuffer()
        # works in Pyodide
        if hasattr(buffer, "to_py"):
            return buffer.to_py()
        # shims in MicroPython
        return memoryview(_as_bytearray(buffer))

    # https://developer.mozilla.org/en-US/docs/Web/API/Response/blob
    async def blob(self):
        response = await self._response()
        return await response.blob()

    # return a bytearray from the uint8 view of the buffer
    async def bytearray(self):
        buffer = await self._arrayBuffer()
        return _as_bytearray(buffer)

    # https://developer.mozilla.org/en-US/docs/Web/API/Response/json
    async def json(self):
        return json.loads(await self.text())

    # https://developer.mozilla.org/en-US/docs/Web/API/Response/text
    async def text(self):
        response = await self._response()
        return await response.text()


def fetch(url, **kw):
    return _Fetch(url, **kw)
