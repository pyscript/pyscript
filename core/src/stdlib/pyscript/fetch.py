"""
A Pythonic wrapper around JavaScript's fetch API.

This module provides a Python-friendly interface to the browser's fetch API,
returning native Python data types and supported directly awaiting the promise
and chaining method calls directly on the promise.

```python
from pyscript.fetch import fetch
url = "https://api.example.com/data"

# Pattern 1: Await the response, then extract data.
response = await fetch(url)
data = await response.json()

# Pattern 2: Chain method calls directly on the promise.
data = await fetch(url).json()
```
"""

import json
import js
from pyscript.util import as_bytearray


class _FetchResponse:
    """
    Wraps a JavaScript Response object with Pythonic data extraction methods.

    This wrapper ensures that data returned from fetch is, if possible, in
    native Python types rather than JavaScript types.
    """

    def __init__(self, response):
        self._response = response

    def __getattr__(self, attr):
        """
        Provide access to underlying Response properties like ok, status, etc.
        """
        return getattr(self._response, attr)

    async def arrayBuffer(self):
        """
        Get response body as a buffer (memoryview or bytes).

        Returns a memoryview in MicroPython or bytes in Pyodide, representing
        the raw binary data.
        """
        buffer = await self._response.arrayBuffer()
        if hasattr(buffer, "to_py"):
            # Pyodide conversion.
            return buffer.to_py()
        # MicroPython conversion.
        return memoryview(as_bytearray(buffer))

    async def blob(self):
        """
        Get response body as a JavaScript Blob object.

        Returns the raw JS Blob for use with other JS APIs.
        """
        return await self._response.blob()

    async def bytearray(self):
        """
        Get response body as a Python bytearray.

        Returns a mutable bytearray containing the response data.
        """
        buffer = await self._response.arrayBuffer()
        return as_bytearray(buffer)

    async def json(self):
        """
        Parse response body as JSON and return Python objects.

        Returns native Python dicts, lists, strings, numbers, etc.
        """
        return json.loads(await self.text())

    async def text(self):
        """
        Get response body as a text string.
        """
        return await self._response.text()


class _FetchPromise:
    """
    Wraps the fetch promise to enable direct method chaining.

    This allows calling response methods directly on the fetch promise:
    `await fetch(url).json()` instead of requiring two separate awaits.

    This feels more Pythonic since it matches typical usage patterns
    Python developers have got used to via libraries like `requests`.
    """

    def __init__(self, promise):
        self._promise = promise
        # To be resolved in the future via the setup() static method.
        promise._response = None
        # Add convenience methods directly to the promise.
        promise.arrayBuffer = self.arrayBuffer
        promise.blob = self.blob
        promise.bytearray = self.bytearray
        promise.json = self.json
        promise.text = self.text

    @staticmethod
    def setup(promise, response):
        """
        Store the resolved response on the promise for later access.
        """
        promise._response = _FetchResponse(response)
        return promise._response

    async def _get_response(self):
        """
        Get the cached response, or await the promise if not yet resolved.
        """
        if not self._promise._response:
            await self._promise
        return self._promise._response

    async def arrayBuffer(self):
        response = await self._get_response()
        return await response.arrayBuffer()

    async def blob(self):
        response = await self._get_response()
        return await response.blob()

    async def bytearray(self):
        response = await self._get_response()
        return await response.bytearray()

    async def json(self):
        response = await self._get_response()
        return await response.json()

    async def text(self):
        response = await self._get_response()
        return await response.text()


def fetch(url, **options):
    """
    Fetch a resource from the network using a Pythonic interface.

    This wraps JavaScript's fetch API, returning Python-native data types
    and supporting both direct promise awaiting and method chaining.

    The function takes a `url` and optional fetch `options` as keyword
    arguments. The `options` correspond to the JavaScript fetch API's
    RequestInit dictionary, and commonly include:

    - `method`: HTTP method (e.g., `"GET"`, `"POST"`, `"PUT"` etc.)
    - `headers`: Dict of request headers.
    - `body`: Request body (string, dict for JSON, etc.)

    See the MDN documentation for details:
    https://developer.mozilla.org/en-US/docs/Web/API/RequestInit

    The function returns a promise that resolves to a Response-like object
    with Pythonic methods to extract data:

    - `await response.json()` to get JSON as Python objects.
    - `await response.text()` to get text data.
    - `await response.bytearray()` to get raw data as a bytearray.
    - `await response.arrayBuffer()` to get raw data as a memoryview or bytes.
    - `await response.blob()` to get the raw JS Blob object.

    It's also possible to chain these methods directly on the fetch promise:
    `data = await fetch(url).json()`

    The returned response object also exposes standard properties like
    `ok`, `status`, and `statusText` for checking response status.

    ```python
    # Simple GET request.
    response = await fetch("https://api.example.com/data")
    data = await response.json()

    # Method chaining.
    data = await fetch("https://api.example.com/data").json()

    # POST request with JSON.
    response = await fetch(
        "https://api.example.com/users",
        method="POST",
        headers={"Content-Type": "application/json"},
        body=json.dumps({"name": "Alice"})
    )
    result = await response.json()

    # Check response status codes.
    response = await fetch("https://api.example.com/data")
    if response.ok:
        # Status in the range 200-299.
        data = await response.json()
    elif response.status == 404:
        print("Resource not found")
    else:
        print(f"Error: {response.status} {response.statusText}")
    ```
    """
    # Convert Python dict to JavaScript object.
    js_options = js.JSON.parse(json.dumps(options))

    # Setup response handler to wrap the result.
    def on_response(response, *_):
        return _FetchPromise.setup(promise, response)

    promise = js.fetch(url, js_options).then(on_response)
    _FetchPromise(promise)
    return promise
