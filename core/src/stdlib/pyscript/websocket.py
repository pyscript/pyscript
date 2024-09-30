import js
from pyscript.ffi import create_proxy
from pyscript.util import as_bytearray

code = "code"
protocols = "protocols"
reason = "reason"
methods = ["onclose", "onerror", "onmessage", "onopen"]


class EventMessage:
    def __init__(self, event):
        self._event = event

    def __getattr__(self, attr):
        value = getattr(self._event, attr)

        if attr == "data" and not isinstance(value, str):
            if hasattr(value, "to_py"):
                return value.to_py()
            # shims in MicroPython
            return memoryview(as_bytearray(value))

        return value


class WebSocket(object):
    CONNECTING = 0
    OPEN = 1
    CLOSING = 2
    CLOSED = 3

    def __init__(self, **kw):
        url = kw["url"]
        if protocols in kw:
            socket = js.WebSocket.new(url, kw[protocols])
        else:
            socket = js.WebSocket.new(url)
        object.__setattr__(self, "_ws", socket)

        for t in methods:
            if t in kw:
                # Pyodide fails at setting socket[t] directly
                setattr(socket, t, create_proxy(kw[t]))

    def __getattr__(self, attr):
        return getattr(self._ws, attr)

    def __setattr__(self, attr, value):
        if attr in methods:
            m = lambda e: value(EventMessage(e))
            setattr(self._ws, attr, create_proxy(m))
        else:
            setattr(self._ws, attr, value)

    def close(self, **kw):
        if code in kw and reason in kw:
            self._ws.close(kw[code], kw[reason])
        elif code in kw:
            self._ws.close(kw[code])
        else:
            self._ws.close()

    def send(self, data):
        if isinstance(data, str):
            self._ws.send(data)
        else:
            buffer = js.Uint8Array.new(len(data))
            for pos, b in enumerate(data):
                buffer[pos] = b
            self._ws.send(buffer)
