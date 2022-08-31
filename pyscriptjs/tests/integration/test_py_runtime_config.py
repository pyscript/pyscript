import os
import tarfile

import requests

from .support import PyScriptTest

URL = "https://github.com/pyodide/pyodide/releases/download/0.20.0/pyodide-build-0.20.0.tar.bz2"
TAR_NAME = "pyodide-build-0.20.0.tar.bz2"
TMP_DIR = "/tmp/pyscript-test-cache"
TMP_TAR_LOCATION = os.path.join(TMP_DIR, TAR_NAME)


def download_and_unzip(url, extract_to="."):
    if not (os.path.exists(TMP_DIR) and TAR_NAME in os.listdir(TMP_DIR)):
        os.makedirs(TMP_DIR, exist_ok=True)
        response = requests.get(url, stream=True)
        with open(TMP_TAR_LOCATION, "wb") as f:
            f.write(response.raw.read())
    file = tarfile.open(name=TMP_TAR_LOCATION, mode="r:bz2")
    file.extractall(path=extract_to)


class TestRuntimeConfig(PyScriptTest):
    # The default pyodide version is 0.21.2 as of writing
    # this test which is newer than the one we are loading below
    # (after downloading locally) -- which is 0.20.0

    # The test checks if loading a different runtime is possible
    # and that too from a locally downloaded file without needing
    # the use of explicit `indexURL` calculation.
    def test_runtime_config(self):
        download_and_unzip(
            url=URL,
            extract_to=self.tmpdir,
        )

        self.pyscript_run(
            snippet="""
            <py-script>
                import sys, js
                pyodide_version = sys.modules["pyodide"].__version__
                js.console.info("version", pyodide_version)
                pyodide_version
            </py-script>
        """,
            extra_head="""
            <py-config>
                runtimes:
                - src: "/pyodide/pyodide.js"
                  name: pyodide-0.20.0
                  lang: python
            </py-config>
        """,
        )

        assert self.console.info.lines == ["version 0.20.0"]
        version = self.page.locator("py-script").inner_text()
        assert version == "0.20.0"
