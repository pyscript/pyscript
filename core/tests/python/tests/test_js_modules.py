"""
Ensure referenced JavaScript modules are available via the pyscript.js_modules
object.
"""

import upytest

from pyscript import RUNNING_IN_WORKER


@upytest.skip("Main thread only.", skip_when=RUNNING_IN_WORKER)
def test_js_module_is_available_on_main():
    """
    The "hello" function in the example_js_module.js file is available via the
    js_modules object while running in the main thread. See the settings.json
    file for the configuration that makes this possible.
    """
    from pyscript.js_modules import greeting

    assert greeting.hello() == "Hello from JavaScript!"


@upytest.skip("Worker only.", skip_when=not RUNNING_IN_WORKER)
def test_js_module_is_available_on_worker():
    """
    The "hello" function in the example_js_module.js file is available via the
    js_modules object while running in a worker. See the settings.json file for
    the configuration that makes this possible.
    """
    from pyscript.js_modules import greeting

    assert greeting.hello() == "Hello from JavaScript!"


@upytest.skip("Worker only.", skip_when=not RUNNING_IN_WORKER)
def test_js_module_is_available_on_worker():
    """
    The "hello" function in the example_js_worker_module.js file is available
    via the js_modules object while running in a worker.
    """
    from pyscript.js_modules import greeting_worker

    assert greeting_worker.hello() == "Hello from JavaScript in a web worker!"


@upytest.skip("Main thread only.", skip_when=RUNNING_IN_WORKER)
def test_js_worker_module_is_not_available_on_main():
    """
    The "hello" function in the example_js_worker_module.js file is not
    available via the js_modules object while running in the main thread.
    """
    with upytest.raises(ImportError):
        from pyscript.js_modules import greeting_worker
