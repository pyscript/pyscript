from collections.abc import Callable
import contextvars
from typing import Any
from js import setTimeout
from pyodide.webloop import WebLoop
import asyncio
from ._compat import create_once_callable
from contextlib import contextmanager

class _PyscriptWebLoop(WebLoop):
    def __init__(self):
        super().__init__()
        self._ready = False
        self._usercode = False
        self._deferred_handles = []

    def call_later(
        self,
        delay: float,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        """Based on Pyodide's webloop
        
        With some unneeded stuff removed and a mechanism for deferring tasks
        scheduled from user code.
        """
        if delay < 0:
            raise ValueError("Can't schedule in the past")
        h = asyncio.Handle(callback, args, self, context=context)

        def run_handle():
            if h.cancelled():
                return
            h._run()

        if self._ready or not self._usercode:
            setTimeout(create_once_callable(run_handle), delay * 1000)
        else:
            self._deferred_handles.append((run_handle, self.time() + delay))
        return h

    def start_(self):
        asyncio._set_running_loop(self)
        t = self.time()
        for [run_handle, delay] in self._deferred_handles:
            delay = delay - t
            if delay < 0:
                delay = 0
            setTimeout(create_once_callable(run_handle), delay * 1000)
        self._ready = True
        self._deferred_handles = []


_LOOP = None

def _set_event_loop():
    global _LOOP
    _LOOP = _PyscriptWebLoop()
    asyncio.set_event_loop(_LOOP)

def _start_loop():
    _LOOP.start_()


@contextmanager
def _defer_user_asyncio():
    _LOOP._usercode = True
    try:
        yield
    finally:
        _LOOP._usercode = False
