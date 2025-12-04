"""
Tests for the pyscript.workers module.

Note: These tests can only run in the main thread since they test worker
creation and access.

I've added the import of workers and create_named_worker inside each test
so that the test module can still be imported in a worker context without
errors. It also means the module is GC'd between tests, which is a good way
to ensure each test is independent given the global nature of the workers
proxy.
"""

import upytest
from pyscript import RUNNING_IN_WORKER


@upytest.skip("Main thread only", skip_when=RUNNING_IN_WORKER)
async def test_workers_proxy_exists():
    """
    The workers proxy should be accessible and support both.
    bracket and dot notation.
    """
    from pyscript import workers

    assert workers is not None
    # Defined in the HTML.
    worker = await workers["testworker"]
    assert worker is not None
    worker = await workers.testworker
    assert worker is not None


@upytest.skip("Main thread only", skip_when=RUNNING_IN_WORKER)
async def test_worker_exported_functions():
    """
    Functions exported from a worker should be callable.
    """
    from pyscript import workers

    worker = await workers["testworker"]
    # Test multiple exported functions.
    add_result = await worker.add(10, 20)
    multiply_result = await worker.multiply(4, 5)
    greeting = await worker.get_message()

    assert add_result == 30
    assert multiply_result == 20
    assert greeting == "Hello from worker"


@upytest.skip("Main thread only", skip_when=RUNNING_IN_WORKER)
async def test_create_named_worker_basic():
    """
    Creating a named worker dynamically should work.
    """
    from pyscript import create_named_worker, workers

    worker = await create_named_worker(
        src="./worker_functions.py", name="dynamic-test-worker"
    )

    assert worker is not None
    # Verify we can call its functions.
    result = await worker.add(1, 2)
    assert result == 3
    # Verify it's also accessible via the workers proxy.
    same_worker = await workers["dynamic-test-worker"]
    result2 = await same_worker.add(3, 4)
    assert result2 == 7


@upytest.skip("Main thread only", skip_when=RUNNING_IN_WORKER)
async def test_create_named_worker_with_config():
    """
    Creating a worker with configuration should work.
    """
    from pyscript import create_named_worker

    # Create worker with a PyScript configuration dict.
    worker = await create_named_worker(
        src="./worker_functions.py",
        name="configured-worker",
        config={"packages_cache": "never"},
    )
    assert worker is not None
    # Worker should still function normally.
    result = await worker.multiply(6, 7)
    assert result == 42


@upytest.skip("Main thread only", skip_when=RUNNING_IN_WORKER)
async def test_create_named_worker_micropython():
    """
    Creating a MicroPython worker should work.
    """
    from pyscript import create_named_worker

    worker = await create_named_worker(
        src="./worker_functions.py", name="mpy-worker", type="mpy"
    )
    assert worker is not None
    # Verify functionality.
    result = await worker.add(100, 200)
    assert result == 300
