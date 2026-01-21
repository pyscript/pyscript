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


@upytest.skip("Main thread only", skip_when=RUNNING_IN_WORKER)
async def test_find_path_networkx_parallel_pyodide():
    """
    Inter-thread sync should send and receive NetworkX graphs.

    The output from :func:`networkx.to_dict_of_dicts` is nicely JSON
    serializable; there should be no issue.

    Pathfinding is done with three workers in parallel. That's the way you
    want to do it in a real-time strategy game, for instance.

    """
    import random
    from pyscript import create_named_worker

    random.seed(0)
    worker0 = await create_named_worker(src="./worker_functions.py", name="py-worker0", config='{"packages": ["networkx"]}', type="py")
    assert worker0 is not None
    worker1 = await create_named_worker(src="./worker_functions.py", name="py-worker1", config='{"packages": ["networkx"]}', type="py")
    assert worker1 is not None
    worker2 = await create_named_worker(src="./worker_functions.py", name="py-worker2", config='{"packages": ["networkx"]}', type="py")
    assert worker2 is not None
    our_workers = [worker0, worker1, worker2]

    graphs = {
        "barbell_graph": {0: {1: {}, 2: {}}, 1: {0: {}, 2: {}},
                          2: {0: {}, 1: {}, 3: {}}, 3: {4: {}, 2: {}},
                          4: {3: {}, 5: {}}, 5: {4: {}, 6: {}},
                          6: {5: {}, 7: {}}, 7: {6: {}, 8: {}},
                          8: {9: {}, 10: {}, 7: {}}, 9: {8: {}, 10: {}},
                          10: {8: {}, 9: {}}},
        "complete_graph": {0: {1: {}, 2: {}, 3: {}, 4: {}},
                           1: {0: {}, 2: {}, 3: {}, 4: {}},
                           2: {0: {}, 1: {}, 3: {}, 4: {}},
                           3: {0: {}, 1: {}, 2: {}, 4: {}},
                           4: {0: {}, 1: {}, 2: {}, 3: {}}},
        "circular_ladder_graph": {0: {1: {}, 5: {}, 4: {}},
                                  1: {0: {}, 2: {}, 6: {}},
                                  2: {1: {}, 3: {}, 7: {}},
                                  3: {2: {}, 4: {}, 8: {}},
                                  4: {3: {}, 9: {}, 0: {}},
                                  5: {6: {}, 0: {}, 9: {}},
                                  6: {5: {}, 7: {}, 1: {}},
                                  7: {6: {}, 8: {}, 2: {}},
                                  8: {7: {}, 9: {}, 3: {}},
                                  9: {8: {}, 4: {}, 5: {}}}
    }


    for name, graph_d in graphs.items():
        print(f"Will find paths in {name}")
        nodes = list(graph_d.keys())
        random.shuffle(nodes)
        coros = []
        nodepairs = []
        for worker in our_workers:
            a = nodes.pop()
            b = nodes.pop()
            nodepairs.append((a, b))
            coros.append(worker.dijkstra_path(graph_d, a, b))
        for coro, (a, b) in zip(coros, nodepairs):
            the_path = await coro
            if the_path is None:
                print(f"there is no path from {a} to {b}")
            else:
                print(f"path from {a} to {b} found: {the_path}")
