"""
Ensure the pyscript.window object refers to the main thread's window object.
"""

import upytest

from pyscript import RUNNING_IN_WORKER, window


@upytest.skip("Main thread only.", skip_when=RUNNING_IN_WORKER)
def test_window_in_main_thread():
    """
    The window object should refer to the main thread's window object.
    """
    # The window will have a document.
    assert window.document


@upytest.skip("Worker only.", skip_when=not RUNNING_IN_WORKER)
def test_window_in_worker():
    """
    The window object should refer to the worker's self object, even though
    this code is running in a web worker.
    """
    # The window will have a document.
    assert window.document
