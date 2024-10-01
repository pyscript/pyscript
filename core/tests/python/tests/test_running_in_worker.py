"""
Ensure the pyscript.RUNNING_IN_WORKER flag is set correctly (a sanity check).
"""

import upytest

from pyscript import RUNNING_IN_WORKER, document

# In the test suite, running in a worker is flagged by the presence of the
# "worker" query string. We do this to avoid using RUNNING_IN_WORKER to skip
# tests that check RUNNING_IN_WORKER.
in_worker = "worker" in document.location.search.lower()


@upytest.skip("Main thread only.", skip_when=in_worker)
def test_running_in_main():
    """
    The flag should be False.
    """
    assert RUNNING_IN_WORKER is False


@upytest.skip("Worker only.", skip_when=not in_worker)
def test_running_in_worker():
    """
    The flag should be True.
    """
    assert RUNNING_IN_WORKER is True
