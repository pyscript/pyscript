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


class TestRuntimeConfig(PyScriptTest):
    # The default pyodide version is 0.21.2 as of writing
    # this test which is newer than the one we are loading below
    # (after downloading locally) -- which is 0.20.0

    # The test checks if loading a different runtime is possible
    # and that too from a locally downloaded file without needing
    # the use of explicit `indexURL` calculation.
    def test_runtime_config(self, tar_location):
        unzip(
            location=tar_location,
            extract_to=self.tmpdir,
        )

        self.pyscript_run(
            snippet="""
            <py-script>
                import sys, js
                pyodide_version = sys.modules["pyodide"].__version__
                js.console.log("version", pyodide_version)
                display(pyodide_version)
            </py-script>
        """,
            extra_head="""
            <py-config type="json">
                {
                    "runtimes": [{
                        "src": "/pyodide/pyodide.js",
                        "name": "pyodide-0.20.0",
                        "lang": "python"
                    }]
                }
            </py-config>
        """,
        )

        assert self.console.log.lines == [self.PY_COMPLETE, "version 0.20.0"]
        version = self.page.locator("py-script").inner_text()
        assert version == "0.20.0"
