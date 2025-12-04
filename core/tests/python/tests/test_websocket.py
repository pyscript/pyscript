"""
Exercise the pyscript.Websocket class.
"""

import asyncio
import upytest

from pyscript import WebSocket


# Websocket tests are disabled by default because they don't reliably work in
# playwright based tests. Feel free to set this to False to enable them when
# running tests locally in an actual browser (they all pass there).
SKIP_WEBSOCKET_TESTS = True


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_with_attributes():
    """
    Event handlers assigned via object attributes.

    The Websocket class should be able to connect to a websocket server and
    send and receive messages.

    Use of echo.websocket.org means:

    1) When connecting it responds with a "Request served by" message.
    2) When sending a message it echos it back.
    """
    connected_flag = False
    closed_flag = False
    messages = []
    ready_to_test = asyncio.Event()

    def on_open(event):
        nonlocal connected_flag
        connected_flag = True
        ws.send("Hello, world!")  # A message to echo.

    def on_message(event):
        messages.append(event.data)
        if len(messages) == 2:  # We're done.
            ws.close()

    def on_close(event):
        nonlocal closed_flag
        closed_flag = True
        ready_to_test.set()  # Finished!

    ws = WebSocket(url="wss://echo.websocket.org")
    ws.onopen = on_open
    ws.onmessage = on_message
    ws.onclose = on_close
    # Wait for everything to be finished.
    await ready_to_test.wait()
    assert connected_flag is True
    assert len(messages) == 2
    assert "request served by" in messages[0].lower()
    assert messages[1] == "Hello, world!"
    assert closed_flag is True


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_with_init():
    """
    Event handlers assigned via __init__ arguments.

    The Websocket class should be able to connect to a websocket server and
    send and receive messages.

    Use of echo.websocket.org means:

    1) When connecting it responds with a "Request served by" message.
    2) When sending a message it echos it back.
    """
    connected_flag = False
    closed_flag = False
    messages = []
    ready_to_test = asyncio.Event()

    def on_open(event):
        nonlocal connected_flag
        connected_flag = True
        ws.send("Hello, world!")  # A message to echo.

    def on_message(event):
        messages.append(event.data)
        if len(messages) == 2:  # We're done.
            ws.close()

    def on_close(event):
        nonlocal closed_flag
        closed_flag = True
        ready_to_test.set()  # Finished!

    ws = WebSocket(
        url="wss://echo.websocket.org",
        onopen=on_open,
        onmessage=on_message,
        onclose=on_close,
    )
    # Wait for everything to be finished.
    await ready_to_test.wait()
    assert connected_flag is True
    assert len(messages) == 2
    assert "request served by" in messages[0].lower()
    assert messages[1] == "Hello, world!"
    assert closed_flag is True


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_async_handlers():
    """
    Async event handlers should work correctly.
    """
    messages = []
    ready_to_test = asyncio.Event()

    async def on_open(event):
        await asyncio.sleep(0)
        ws.send("async test")

    async def on_message(event):
        await asyncio.sleep(0)
        messages.append(event.data)
        if len(messages) == 2:
            ws.close()

    async def on_close(event):
        await asyncio.sleep(0)
        ready_to_test.set()

    ws = WebSocket(
        url="wss://echo.websocket.org",
        onopen=on_open,
        onmessage=on_message,
        onclose=on_close,
    )

    await ready_to_test.wait()
    assert len(messages) == 2
    assert messages[1] == "async test"


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_binary_data_conversion():
    """
    WebSocket should convert binary data to memoryview for Python.
    """
    messages = []
    ready_to_test = asyncio.Event()

    def on_open(event):
        # Send binary data as bytearray.
        binary_data = bytearray([0x48, 0x65, 0x6C, 0x6C, 0x6F])
        ws.send(binary_data)

    def on_message(event):
        messages.append(event.data)
        if len(messages) == 2:
            ws.close()

    def on_close(event):
        ready_to_test.set()

    ws = WebSocket(
        url="wss://echo.websocket.org",
        onopen=on_open,
        onmessage=on_message,
        onclose=on_close,
    )

    await ready_to_test.wait()
    assert len(messages) == 2
    # Verify wrapper converts binary to memoryview Python type.
    assert isinstance(messages[1], memoryview)


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_send_bytes_conversion():
    """
    WebSocket send should convert Python bytes to JS Uint8Array.
    """
    messages = []
    ready_to_test = asyncio.Event()

    def on_open(event):
        # Test that bytes are converted properly.
        ws.send(bytes([0x41, 0x42, 0x43]))

    def on_message(event):
        messages.append(event.data)
        if len(messages) == 2:
            ws.close()

    def on_close(event):
        ready_to_test.set()

    ws = WebSocket(
        url="wss://echo.websocket.org",
        onopen=on_open,
        onmessage=on_message,
        onclose=on_close,
    )

    await ready_to_test.wait()
    assert len(messages) == 2


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_event_wrapper():
    """
    WebSocketEvent wrapper should provide access to event properties.
    """
    event_types = []
    ready_to_test = asyncio.Event()

    def on_open(event):
        event_types.append(event.type)
        ws.send("test")

    def on_message(event):
        event_types.append(event.type)
        # Verify event wrapper exposes properties.
        assert hasattr(event, "data")
        assert hasattr(event, "type")
        if len(event_types) >= 2:
            ws.close()

    def on_close(event):
        event_types.append(event.type)
        ready_to_test.set()

    ws = WebSocket(
        url="wss://echo.websocket.org",
        onopen=on_open,
        onmessage=on_message,
        onclose=on_close,
    )

    await ready_to_test.wait()
    assert "open" in event_types
    assert "message" in event_types
    assert "close" in event_types


@upytest.skip("Websocket tests are disabled.", skip_when=SKIP_WEBSOCKET_TESTS)
async def test_websocket_reassign_handler():
    """
    Event handlers should be replaceable after creation.
    """
    first_handler_called = False
    second_handler_called = False
    ready_to_test = asyncio.Event()

    def first_handler(event):
        nonlocal first_handler_called
        first_handler_called = True

    def second_handler(event):
        nonlocal second_handler_called
        second_handler_called = True
        ws.close()

    def on_open(event):
        # Replace the message handler before any messages arrive.
        ws.onmessage = second_handler
        ws.send("test")

    def on_close(event):
        ready_to_test.set()

    ws = WebSocket(url="wss://echo.websocket.org", onopen=on_open, onclose=on_close)
    ws.onmessage = first_handler

    await ready_to_test.wait()
    # Verify that handler replacement worked.
    assert first_handler_called is False
    assert second_handler_called is True
