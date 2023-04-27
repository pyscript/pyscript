from .support import PyScriptTest, skip_worker


class TestDisplayLineBreak(PyScriptTest):
    @skip_worker("FIXME: there is no document in a worker")
    def test_display_line_break(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('hello\nworld')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "hello\nworld" == text_content

    @skip_worker("FIXME: there is no document in a worker")
    def test_amp(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('a &amp; b')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "a &amp; b" == text_content

    @skip_worker("FIXME: there is no document in a worker")
    def test_quot(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('a &quot; b')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "a &quot; b" == text_content

    @skip_worker("FIXME: there is no document in a worker")
    def test_lt_gt(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('< &lt; &gt; >')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "< &lt; &gt; >" == text_content
