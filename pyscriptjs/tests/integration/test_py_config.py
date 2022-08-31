import tarfile
from io import BytesIO

import requests

from .support import PyScriptTest

URL = "https://github.com/pyodide/pyodide/releases/download/0.20.0/pyodide-build-0.20.0.tar.bz2"


def download_and_unzip(url, extract_to="."):
    response = requests.get(url, stream=True)
    file = tarfile.open(fileobj=BytesIO(response.raw.read()), mode="r:bz2")
    file.extractall(path=extract_to)


class TestPyConfig(PyScriptTest):
    def test_config(self):
        download_and_unzip(
            url=URL,
            extract_to=self.tmpdir,
        )

        self.pyscript_run(
            snippet="""
            <py-script>
                import sys
                sys.modules["pyodide"].__version__
            </py-script>
        """,
            config="""
            <py-config>
                autoclose_loader: true
                runtimes:
                - src: "/pyodide/pyodide.js"
                  name: pyodide-0.20.0
                  lang: python
            </py-config>
        """,
        )

        version = self.page.locator("py-script").inner_text()
        assert version == "0.20.0"
