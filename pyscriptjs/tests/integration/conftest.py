"""All data required for testing examples"""
import threading
from http.server import HTTPServer as SuperHTTPServer
from http.server import SimpleHTTPRequestHandler

import pytest

from .support import Logger


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
        help="Automatically open a devtools panel. Implies --headed",
    )


@pytest.fixture(scope="session")
def browser_type_launch_args(request):
    """
    Override the browser_type_launch_args defined by pytest-playwright to
    support --devtools.

    NOTE: this has been tested with pytest-playwright==0.3.0. It might break
    with newer versions of it.
    """
    if request.config.option.dev:
        request.config.option.headed = True
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
