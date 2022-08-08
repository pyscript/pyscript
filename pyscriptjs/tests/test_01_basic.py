from .support import PyScriptTest


class TestBasic(PyScriptTest):
    def test_pyscript_hello(self):
        self.pyscript_run(
            """
            <py-script>
                print('<b>hello pyscript</b>')
            </py-script>
        """
        )
        content = self.page.content()
        # XXX we should test the DOM
        assert "hello pyscript" in content
