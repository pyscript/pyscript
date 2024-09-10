import shutil
import threading
from http.server import HTTPServer as SuperHTTPServer
from http.server import SimpleHTTPRequestHandler

import pytest

from .support import Logger


def pytest_cmdline_main(config):
    """
    If we pass --clear-http-cache, we don't enter the main pytest logic, but
    use our custom main instead
    """

    def mymain(config, session):
        print()
        print("-" * 20, "SmartRouter HTTP cache", "-" * 20)
        # unfortunately pytest-cache doesn't offer a public API to selectively
        # clear the cache, so we need to peek its internal. The good news is
        # that pytest-cache is very old, stable and robust, so it's likely
        # that this won't break anytime soon.
        cache = config.cache
        base = cache._cachedir.joinpath(cache._CACHE_PREFIX_VALUES, "pyscript")
        if not base.exists():
            print("No cache found, nothing to do")
            return 0
        #
        print("Requests found in the cache:")
        for f in base.rglob("*"):
            if f.is_file():
                # requests are saved in dirs named pyscript/http:/foo/bar, let's turn
                # them into a proper url
                url = str(f.relative_to(base))
                url = url.replace(":/", "://")
                print("    ", url)
        shutil.rmtree(base)
        print("Cache cleared")
        return 0

    if config.option.clear_http_cache:
        from _pytest.main import wrap_session

        return wrap_session(config, mymain)
    return None


def pytest_configure(config):
    """
    THIS IS A WORKAROUND FOR A pytest QUIRK!

    At the moment of writing this conftest defines two new options, --dev and
    --no-fake-server, but because of how pytest works, they are available only
    if this is the "root conftest" for the test session.

    This means that if you are in the pyscript.core directory:

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
        Running a bare "pytest" command from the pyscript.core directory
        is not supported. Please use one of the following commands:
            - pytest tests/integration
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
    parser.addoption(
        "--clear-http-cache",
        action="store_true",
        help="Clear the cache of HTTP requests for SmartRouter",
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


class DevServer(SuperHTTPServer):
    """
    Class for wrapper to run SimpleHTTPServer on Thread.
    Ctrl +Only Thread remains dead when terminated with C.
    Keyboard Interrupt passes.
    """

    def __init__(self, base_url, *args, **kwargs):
        self.base_url = base_url
        super().__init__(*args, **kwargs)

    def run(self):
        try:
            self.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            self.server_close()


@pytest.fixture(scope="session")
def dev_server(logger):
    class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
        enable_cors_headers = True

        @classmethod
        def my_headers(cls):
            if cls.enable_cors_headers:
                return {
                    "Cross-Origin-Embedder-Policy": "require-corp",
                    "Cross-Origin-Opener-Policy": "same-origin",
                }
            return {}

        def end_headers(self):
            self.send_my_headers()
            SimpleHTTPRequestHandler.end_headers(self)

        def send_my_headers(self):
            for k, v in self.my_headers().items():
                self.send_header(k, v)

        def log_message(self, fmt, *args):
            logger.log("http_server", fmt % args, color="blue")

    host, port = "localhost", 8080
    base_url = f"http://{host}:{port}"

    # serve_Run forever under thread
    server = DevServer(base_url, (host, port), MyHTTPRequestHandler)

    thread = threading.Thread(None, server.run)
    thread.start()

    yield server  # Transition to test here

    # End thread
    server.shutdown()
    thread.join()
