try:
    from . import _event_loop_pyodide as _event_loop
except ImportError:
    from . import _event_loop_micropython as _event_loop


def __getattr__(name):
    return getattr(_event_loop, name)
