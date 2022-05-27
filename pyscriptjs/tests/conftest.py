"""All data required for testing examples"""
import os
import threading
from http.server import HTTPServer as SuperHTTPServer
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

import pytest

my_path = Path.cwd() / "examples"
os.chdir(my_path)


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
def http_server():
    host, port = "127.0.0.1", 8080
    base_url = f"http://{host}:{port}"

    # serve_Run forever under thread
    server = HTTPServer((host, port), SimpleHTTPRequestHandler)
    thread = threading.Thread(None, server.run)
    thread.start()

    yield base_url  # Transition to test here

    # End thread
    server.shutdown()
    thread.join()
