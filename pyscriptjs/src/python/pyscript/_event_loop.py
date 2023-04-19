try:
    from ._event_loop_pyodide import *
except ImportError:
    from ._event_loop_micropython import *
