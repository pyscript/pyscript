"""
WebSocket support for PyScript.

This module provides a Pythonic wrapper around the browser's WebSocket API,
enabling two-way communication with WebSocket servers.

Use this for real-time applications:

- Pythonic interface to browser WebSockets.
- Automatic handling of async event handlers.
- Support for receiving text (`str`) and binary (`memoryview`) data.
- Support for sending text (`str`) and binary (`bytes` and `bytearray`) data.
- Compatible with Pyodide and MicroPython.
- Works in webworker contexts.
- Naming deliberately follows the JavaScript WebSocket API closely for
  familiarity.

See the Python docs for an explanation of memoryview:

https://docs.python.org/3/library/stdtypes.html#memoryview

```python
from pyscript import WebSocket


def on_open(event):
    print("Connected!")
    ws.send("Hello server")

def on_message(event):
    print(f"Received: {event.data}")

def on_close(event):
    print("Connection closed")

ws = WebSocket(url="ws://localhost:8080/")
ws.onopen = on_open
ws.onmessage = on_message
ws.onclose = on_close
```

For more information about the underlying WebSocket API, see:
https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
"""

import js
from pyscript.ffi import create_proxy
from pyscript.util import as_bytearray, is_awaitable


def _attach_event_handler(websocket, handler_name, handler_function):
    """
    Given a `websocket`, and `handler_name`, attach the `handler_function`
    to the `WebSocket` instance, handling both synchronous and asynchronous
    handler functions.

    Creates a JavaScript proxy for the handler and wraps async handlers
    appropriately. Handles the `WebSocketEvent` wrapping for all handlers.
    """
    if is_awaitable(handler_function):

        async def async_wrapper(event):
            await handler_function(WebSocketEvent(event))

        wrapped_handler = create_proxy(async_wrapper)
    else:
        wrapped_handler = create_proxy(
            lambda event: handler_function(WebSocketEvent(event))
        )
    # Note: Direct assignment (websocket[handler_name]) fails in Pyodide.
    setattr(websocket, handler_name, wrapped_handler)


class WebSocketEvent:
    """
    A read-only wrapper for WebSocket event objects.

    This class wraps browser WebSocket events and provides convenient access
    to event properties. It handles the conversion of binary data from
    JavaScript typed arrays to Python bytes-like objects.

    The most commonly used property is `event.data`, which contains the
    message data for "message" events.

    ```python
    def on_message(event):  # The event is a WebSocketEvent instance.
        # For text messages.
        if isinstance(event.data, str):
            print(f"Text: {event.data}")
        else:
            # For binary messages.
            print(f"Binary: {len(event.data)} bytes")
    ```
    """

    def __init__(self, event):
        """
        Create a WebSocketEvent wrapper from an underlying JavaScript
        `event`.
        """
        self._event = event

    def __getattr__(self, attr):
        """
        Get an attribute `attr` from the underlying event object.

        Handles special conversion of binary data from JavaScript typed
        arrays to Python memoryview objects.
        """
        value = getattr(self._event, attr)
        if attr == "data" and not isinstance(value, str):
            if hasattr(value, "to_py"):
                # Pyodide - convert JavaScript typed array to Python.
                return value.to_py()
            else:
                # MicroPython - manually convert JS ArrayBuffer.
                return memoryview(as_bytearray(value))
        return value


class WebSocket:
    """
    This class provides a Python-friendly interface to WebSocket connections,
    handling communication with WebSocket servers. It supports both text and
    binary data transmission.

    It's possible to access the underlying WebSocket methods and properties
    directly if needed. However, the wrapper provides a more Pythonic API.

    If you need to work with the raw JavaScript WebSocket instance, you can
    access it via the `_js_websocket` attribute.

    Using textual (`str`) data:

    ```python
    from pyscript import WebSocket


    # Create WebSocket with handlers as arguments.
    def handle_message(event):
        print(f"Got: {event.data}")

    ws = WebSocket(
        url="ws://echo.websocket.org/",
        onmessage=handle_message
    )

    # Or assign handlers after creation.
    def handle_open(event):
        ws.send("Hello!")

    ws.onopen = handle_open
    ```

    Using binary (`memoryview`) data:

    ```python
    def handle_message(event):
        if isinstance(event.data, str):
            print(f"Text: {event.data}")
        else:
            # Binary data as memoryview.
            print(f"Binary: {len(event.data)} bytes")

    ws = WebSocket(url="ws://example.com/", onmessage=handle_message)

    # Send binary data.
    data = bytearray([0x01, 0x02, 0x03])
    ws.send(data)
    ```

    See: https://docs.python.org/3/library/stdtypes.html#memoryview
    """

    # WebSocket ready state constants.
    CONNECTING = 0
    OPEN = 1
    CLOSING = 2
    CLOSED = 3

    def __init__(self, url, protocols=None, **handlers):
        """
        Create a new WebSocket connection from the given `url` (ws:// or
        wss://). Optionally specify `protocols` (a string or a list of
        protocol strings) and event handlers (onopen, onmessage, etc.) as
        keyword arguments.

        These arguments and naming conventions mirror those of the underlying
        JavaScript WebSocket API for familiarity.

        https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

        If you need access to the underlying JavaScript WebSocket instance,
        you can get it via the `_js_websocket` attribute.

        ```python
        # Basic connection.
        ws = WebSocket(url="ws://localhost:8080/")

        # With protocol.
        ws = WebSocket(
            url="wss://example.com/socket",
            protocols="chat"
        )

        # With handlers.
        ws = WebSocket(
            url="ws://localhost:8080/",
            onopen=lambda e: print("Connected"),
            onmessage=lambda e: print(e.data)
        )
        ```
        """
        # Create underlying JavaScript WebSocket.
        if protocols:
            js_websocket = js.WebSocket.new(url, protocols)
        else:
            js_websocket = js.WebSocket.new(url)
        # Set binary type to arraybuffer for easier Python handling.
        js_websocket.binaryType = "arraybuffer"
        # Store the underlying WebSocket.
        # Use object.__setattr__ to bypass our custom __setattr__.
        object.__setattr__(self, "_js_websocket", js_websocket)
        # Attach any event handlers passed as keyword arguments.
        for handler_name, handler in handlers.items():
            setattr(self, handler_name, handler)

    def __getattr__(self, attr):
        """
        Get an attribute `attr` from the underlying WebSocket.

        This allows transparent access to WebSocket properties like
        readyState, url, bufferedAmount, etc.
        """
        return getattr(self._js_websocket, attr)

    def __setattr__(self, attr, value):
        """
        Set an attribute `attr` on the WebSocket to the given `value`.

        Event handler attributes (onopen, onmessage, etc.) are specially
        handled to create proper proxies. Other attributes are set on the
        underlying WebSocket directly.
        """
        if attr in ["onclose", "onerror", "onmessage", "onopen"]:
            _attach_event_handler(self._js_websocket, attr, value)
        else:
            setattr(self._js_websocket, attr, value)

    def send(self, data):
        """
        Send data through the WebSocket.

        Accepts both text (str) and binary data (bytes, bytearray, etc.).
        Binary data is automatically converted to a JavaScript Uint8Array.

        ```python
        # Send text.
        ws.send("Hello server!")

        # Send binary.
        ws.send(bytes([1, 2, 3, 4]))
        ws.send(bytearray([5, 6, 7, 8]))
        ```

        The WebSocket **must be in the OPEN state to send data**.
        """
        if isinstance(data, str):
            self._js_websocket.send(data)
        else:
            buffer = js.Uint8Array.new(len(data))
            for index, byte_value in enumerate(data):
                buffer[index] = byte_value
            self._js_websocket.send(buffer)

    def close(self, code=None, reason=None):
        """
        Close the WebSocket connection. Optionally specify a `code` (integer)
        and a `reason` (string) for closing the connection.

        ```python
        # Normal close.
        ws.close()

        # Close with code and reason.
        ws.close(code=1000, reason="Task completed")
        ```

        Usage and values for `code` and `reasons` are explained here:

        https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close
        """
        if code and reason:
            self._js_websocket.close(code, reason)
        elif code:
            self._js_websocket.close(code)
        else:
            self._js_websocket.close()
