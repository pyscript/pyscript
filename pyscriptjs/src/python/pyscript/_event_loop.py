import asyncio
import contextvars
from collections.abc import Callable
from contextlib import contextmanager
from typing import Any

from js import setTimeout
from pyodide.ffi import create_once_callable
from pyodide.webloop import WebLoop


class PyscriptWebLoop(WebLoop):
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
        """Based on call_later from Pyodide's webloop

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

    def _schedule_deferred_tasks(self):
        asyncio._set_running_loop(self)
        t = self.time()
        for [run_handle, delay] in self._deferred_handles:
            delay = delay - t
            if delay < 0:
                delay = 0
            setTimeout(create_once_callable(run_handle), delay * 1000)
        self._ready = True
        self._deferred_handles = []


LOOP = None


def install_pyscript_loop():
    global LOOP
    LOOP = PyscriptWebLoop()
    asyncio.set_event_loop(LOOP)


def schedule_deferred_tasks():
    LOOP._schedule_deferred_tasks()


@contextmanager
def defer_user_asyncio():
    LOOP._usercode = True
    try:
        yield
    finally:
        LOOP._usercode = False


def run_until_complete(f):
    return LOOP.run_until_complete(f)
