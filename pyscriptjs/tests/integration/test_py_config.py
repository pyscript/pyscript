import re

from .support import ROOT, PyScriptTest

PYODIDE = ROOT.join("pyscriptjs", "node_modules", "pyodide")


class TestPyConfig(PyScriptTest):
    def test_config(self):
        self.tmpdir.join("pyodide").mksymlinkto(PYODIDE)

        self.pyscript_run(
            snippet="""
            <py-script>
                print('hello pyscript')
            </py-script>
        """,
            config="""
            <py-config>
                autoclose_loader: true
                runtimes:
                - src: "./pyodide/pyodide.js"
                  name: pyodide-0.21
                  lang: python
            </py-config>
        """,
        )

        inner_html = self.page.locator("py-script").inner_html()
        pattern = r'<div id="py-.*">hello pyscript</div>'
        assert re.search(pattern, inner_html)
