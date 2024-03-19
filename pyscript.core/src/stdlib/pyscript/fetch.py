import json

import js

### wrap the response to grant Pythonic results via overrides
class _Response:
    def __init__(self, response):
        self.response = response

    # forward response.ok and others
    def __getattr__(self, attr):
        return getattr(self.response, attr)

    # exposed methods with Pythonic results
    def arrayBuffer(self):
        return _array_buffer(self.response, "")

    def blob(self):
        return _blob(self.response, "")

    def bytearray(self):
        return _bytearray(self.response, "")

    def json(self):
        return _json(self.response, "")

    def text(self):
        return _text(self.response, "")


### generic helpers
def _awaited(fetch, response):
    fetch._response = response
    return _Response(response)

def _as_bytearray(buffer):
    ui8a = js.Uint8Array.new(buffer)
    size = ui8a.length
    ba = bytearray(size)
    for i in range(0, size):
        ba[i] = ui8a[i]
    return ba

def _check(response, url):
    if not response.ok:
        msg = f"URL {url} failed with status {response.status}"
        raise Exception(msg)

async def _buffer(task, url):
    response = await _response(task, url)
    return await response.arrayBuffer()

# return the response and optionally check if it's OK
async def _response(task, url):
    check = False

    if len(url):
        if task._response is None:
            check = True
            task = await task
        else:
            task = task._response

    if check:
        _check(task, url)

    return task

### fetch and response helpers
async def _array_buffer(task, url):
    buffer = await _buffer(task, url)
    # works in Pyodide
    if hasattr(buffer, "to_py"):
        return buffer.to_py()
    # shims in MicroPython
    return memoryview(_as_bytearray(buffer))

async def _blob(task, url):
    response = await _response(task, url)
    return await response.blob()

async def _bytearray(task, url):
    buffer = await _buffer(task, url)
    return _as_bytearray(buffer)

async def _json(task, url):
    response = await _response(task, url)
    return json.loads(await response.text())

async def _text(task, url):
    response = await _response(task, url)
    return await response.text()

### augmented fetch w/ direct access abilities
def fetch(url, **kw):
    options = js.JSON.parse(json.dumps(kw))
    fetch = js.fetch(url, options)
    # flag fetch response as unknown
    fetch._response = None
    # flag fetch response as known if directly awaited
    awaited = fetch.then(lambda response: _awaited(fetch, response))
    # augmented the promise providing direct access
    awaited.arrayBuffer = lambda: _array_buffer(fetch, url)
    awaited.blob = lambda: _blob(fetch, url)
    awaited.bytearray = lambda: _bytearray(fetch, url)
    awaited.json = lambda: _json(fetch, url)
    awaited.text = lambda: _text(fetch, url)
    return awaited
