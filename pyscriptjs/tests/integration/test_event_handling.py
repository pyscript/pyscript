from .support import PyScriptTest, skip_worker


class TestEventHandler(PyScriptTest):
    @skip_worker(reason="FIXME: js.document")
    def test_coderunner(self):
        self.pyscript_run(
            """
            <button py-click-code="print('hello')">Click Me</button>
            """
        )
        self.page.get_by_role("button").click()
        assert "hello" in self.console.log.lines
        self.assert_no_banners()
