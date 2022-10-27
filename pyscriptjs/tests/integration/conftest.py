import threading
from http.server import HTTPServer as SuperHTTPServer
from http.server import SimpleHTTPRequestHandler

import pytest

from .support import Logger


def pytest_configure(config):
    """
    THIS IS A WORKAROUND FOR A pytest QUIRK!

    At the moment of writing this conftest defines two new options, --dev and
    --no-fake-server, but because of how pytest works, they are available only
    if this is the "root conftest" for the test session.

    This means that if you are in the pyscriptjs directory:

    $ py.test                       # does NOT work
    $ py.test tests/integration/    # works

    This happens because there is also test py-unit directory, so in the first
    case the "root conftest" would be tests/conftest.py (which doesn't exist)
    instead of this.

    There are various workarounds, but for now we can just detect it and
    inform the user.

    Related StackOverflow answer: https://stackoverflow.com/a/51733980
    """
    if not hasattr(config.option, "dev"):
        msg = """
        Running a bare "pytest" command from the pyscriptjs directory
        is not supported. Please use one of the following commands:
            - pytest tests/integration
            - pytest tests/py-unit
            - pytest tests/*
            - cd tests/integration; pytest
        """
        pytest.fail(msg)
    else:
        if config.option.dev:
            config.option.headed = True
            config.option.no_fake_server = True


@pytest.fixture(scope="session")
def logger():
    return Logger()


def pytest_addoption(parser):
    parser.addoption(
        "--no-fake-server",
        action="store_true",
        help="Use a real HTTP server instead of http://fakeserver",
    )
    parser.addoption(
        "--dev",
        action="store_true",
        help="Automatically open a devtools panel. Implies --headed and --no-fake-server",
    )


@pytest.fixture(scope="session")
def browser_type_launch_args(request):
    """
    Override the browser_type_launch_args defined by pytest-playwright to
    support --devtools.

    NOTE: this has been tested with pytest-playwright==0.3.0. It might break
    with newer versions of it.
    """
    # this calls the "original" fixture defined by pytest_playwright.py
    launch_options = request.getfixturevalue("browser_type_launch_args")
    if request.config.option.dev:
        launch_options["devtools"] = True
    return launch_options


class HTTPServer(SuperHTTPServer):
    """
    Class for wrapper to run SimpleHTTPServer on Thread.
    Ctrl +Only Thread remains dead when terminated with C.
    Keyboard Interrupt passes.
    """

    def run(self):
        try:
            self.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            self.server_close()


@pytest.fixture(scope="session")
def http_server(logger):
    class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
        def log_message(self, fmt, *args):
            logger.log("http_server", fmt % args, color="blue")

    host, port = "127.0.0.1", 8080
    base_url = f"http://{host}:{port}"

    # serve_Run forever under thread
    server = HTTPServer((host, port), MyHTTPRequestHandler)

    thread = threading.Thread(None, server.run)
    thread.start()

    yield base_url  # Transition to test here

    # End thread
    server.shutdown()
    thread.join()
