import os
import tarfile
import tempfile

import pytest
import requests

from .support import PyScriptTest

URL = "https://github.com/pyodide/pyodide/releases/download/0.20.0/pyodide-build-0.20.0.tar.bz2"
TAR_NAME = "pyodide-build-0.20.0.tar.bz2"


@pytest.fixture
def tar_location(request):
    val = request.config.cache.get("pyodide-0.20-tar", None)
    if val is None:
        response = requests.get(URL, stream=True)
        TMP_DIR = tempfile.mkdtemp()
        TMP_TAR_LOCATION = os.path.join(TMP_DIR, TAR_NAME)
        with open(TMP_TAR_LOCATION, "wb") as f:
            f.write(response.raw.read())
        val = TMP_TAR_LOCATION
        request.config.cache.set("pyodide-0.20-tar", val)
    return val


def unzip(location, extract_to="."):
    file = tarfile.open(name=location, mode="r:bz2")
    file.extractall(path=extract_to)


class TestConfig(PyScriptTest):
    def test_py_config_inline(self):
        self.pyscript_run(
            """
        <py-config type="toml">
            name = "foobar"
        </py-config>

        <py-script>
            import js
            config = js.pyscript_get_config()
            js.console.log("config name:", config.name)
        </py-script>
        """
        )
        assert self.console.log.lines[-1] == "config name: foobar"

    def test_py_config_external(self):
        pyconfig_toml = """
            name = "app with external config"
        """
        self.writefile("pyconfig.toml", pyconfig_toml)
        self.pyscript_run(
            """
        <py-config src="pyconfig.toml" type="toml">
        </py-config>

        <py-script>
            import js
            config = js.pyscript_get_config()
            js.console.log("config name:", config.name)
        </py-script>
        """
        )
        assert self.console.log.lines[-1] == "config name: app with external config"

    # The default pyodide version is 0.23.0 as of writing
    # this test which is newer than the one we are loading below
    # (after downloading locally) -- which is 0.20.0

    # The test checks if loading a different interpreter is possible
    # and that too from a locally downloaded file without needing
    # the use of explicit `indexURL` calculation.
    def test_interpreter_config(self, tar_location):
        unzip(
            location=tar_location,
            extract_to=self.tmpdir,
        )

        self.pyscript_run(
            """
            <py-config type="json">
                {
                    "interpreters": [{
                        "src": "/pyodide/pyodide.js",
                        "name": "pyodide-0.20.0",
                        "lang": "python"
                    }]
                }
            </py-config>

            <py-script>
                import sys, js
                pyodide_version = sys.modules["pyodide"].__version__
                js.console.log("version", pyodide_version)
                display(pyodide_version)
            </py-script>
        """,
        )

        assert self.console.log.lines[-1] == "version 0.20.0"
        version = self.page.locator("py-script").inner_text()
        assert version == "0.20.0"

    def test_runtime_still_works_but_shows_deprecation_warning(self, tar_location):
        unzip(
            location=tar_location,
            extract_to=self.tmpdir,
        )

        self.pyscript_run(
            """
            <py-config type="json">
                {
                    "runtimes": [{
                        "src": "/pyodide/pyodide.js",
                        "name": "pyodide-0.20.0",
                        "lang": "python"
                    }]
                }
            </py-config>

            <py-script>
                import sys, js
                pyodide_version = sys.modules["pyodide"].__version__
                js.console.log("version", pyodide_version)
                display(pyodide_version)
            </py-script>
        """,
        )

        assert self.console.log.lines[-1] == "version 0.20.0"
        version = self.page.locator("py-script").inner_text()
        assert version == "0.20.0"

        deprecation_banner = self.page.wait_for_selector(".alert-banner")
        expected_message = (
            "The configuration option `config.runtimes` is deprecated. "
            "Please use `config.interpreters` instead."
        )
        assert deprecation_banner.inner_text() == expected_message

    def test_invalid_json_config(self):
        # we need wait_for_pyscript=False because we bail out very soon,
        # before being able to write 'PyScript page fully initialized'
        self.pyscript_run(
            """
            <py-config type="json">
                [[
            </py-config>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        assert "SyntaxError: Unexpected end of JSON input" in self.console.error.text
        expected = (
            "(PY1000): The config supplied: [[ is an invalid JSON and cannot be "
            "parsed: SyntaxError: Unexpected end of JSON input"
        )
        assert banner.inner_text() == expected

    def test_invalid_toml_config(self):
        # we need wait_for_pyscript=False because we bail out very soon,
        # before being able to write 'PyScript page fully initialized'
        self.pyscript_run(
            """
            <py-config>
                [[
            </py-config>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        assert "SyntaxError: Expected DoubleQuote" in self.console.error.text
        expected = (
            "(PY1000): The config supplied: [[ is an invalid TOML and cannot be parsed: "
            "SyntaxError: Expected DoubleQuote, Whitespace, or [a-z], [A-Z], "
            '[0-9], "-", "_" but "\\n" found.'
        )
        assert banner.inner_text() == expected

    def test_multiple_py_config(self):
        self.pyscript_run(
            """
            <py-config>
            name = "foobar"
            </py-config>

            <py-config>
            this is ignored and won't even be parsed
            </py-config>

            <py-script>
                import js
                config = js.pyscript_get_config()
                js.console.log("config name:", config.name)
            </py-script>
            """
        )
        banner = self.page.wait_for_selector(".py-warning")
        expected = (
            "Multiple <py-config> tags detected. Only the first "
            "is going to be parsed, all the others will be ignored"
        )
        assert banner.text_content() == expected

    def test_no_interpreter(self):
        snippet = """
            <py-config type="json">
            {
                "interpreters": []
            }
            </py-config>
        """
        self.pyscript_run(snippet, wait_for_pyscript=False)
        div = self.page.wait_for_selector(".py-error")
        assert (
            div.text_content() == "(PY1000): Fatal error: config.interpreter is empty"
        )

    def test_multiple_interpreter(self):
        snippet = """
            <py-config type="json">
            {
                "interpreters": [
                    {
                        "src": "https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js",
                        "name": "pyodide-0.23.0",
                        "lang": "python"
                    },
                    {
                        "src": "http://...",
                        "name": "this will be ignored",
                        "lang": "this as well"
                    }
                ]
            }
            </py-config>

            <py-script>
                import js
                js.console.log("hello world");
            </py-script>
        """
        self.pyscript_run(snippet)
        banner = self.page.wait_for_selector(".py-warning")
        expected = (
            "Multiple interpreters are not supported yet.Only the first will be used"
        )
        assert banner.text_content() == expected
        assert self.console.log.lines[-1] == "hello world"

    def test_paths(self):
        self.writefile("a.py", "x = 'hello from A'")
        self.writefile("b.py", "x = 'hello from B'")
        self.pyscript_run(
            """
            <py-config>
                [[fetch]]
                files = ["./a.py", "./b.py"]
            </py-config>

            <py-script>
                import js
                import a, b
                js.console.log(a.x)
                js.console.log(b.x)
            </py-script>
            """
        )
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-2:] == [
            "hello from A",
            "hello from B",
        ]

    def test_paths_that_do_not_exist(self):
        self.pyscript_run(
            """
            <py-config>
                [[fetch]]
                files = ["./f.py"]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        expected = "(PY0404): Fetching from URL ./f.py failed with " "error 404"

        inner_html = self.page.locator(".py-error").inner_html()

        assert expected in inner_html
        assert expected in self.console.error.lines[-1]

    def test_paths_from_packages(self):
        self.writefile("utils/__init__.py", "")
        self.writefile("utils/a.py", "x = 'hello from A'")
        self.pyscript_run(
            """
            <py-config>
                [[fetch]]
                from = "utils"
                to_folder = "pkg"
                files = ["__init__.py", "a.py"]
            </py-config>

            <py-script>
                import js
                from pkg.a import x
                js.console.log(x)
            </py-script>
            """
        )
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == "hello from A"
