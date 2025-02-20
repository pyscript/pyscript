"""
Ensure the pyscript.current_target function returns the expected target
element's id.
"""

from pyscript import RUNNING_IN_WORKER, current_target
from upytest import is_micropython


def test_current_target():
    """
    The current_target function should return the expected target element's id.
    """
    expected = "py-0"
    if is_micropython:
        expected = "mpy-w0-target" if RUNNING_IN_WORKER else "mpy-0"
    elif RUNNING_IN_WORKER:
        expected = "py-w0-target"
    assert current_target() == expected, f"Expected {expected} got {current_target()}"
