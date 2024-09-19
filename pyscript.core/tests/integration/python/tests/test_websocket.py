"""
Exercise the pyscript.Websocket class.
"""

import asyncio
from pyscript import WebSocket


async def test_websocket():
    """
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
