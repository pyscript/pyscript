from .support import PyScriptTest


class TestPyButton(PyScriptTest):
    def test_on_click(self):
        self.pyscript_run(
            """
            <py-button label="my button">
                import js
                def on_click(evt):
                    js.console.log('clicked!')
            </py-button>
        """
        )
        assert self.console.log.lines[0] == self.PY_COMPLETE
        self.page.locator("text=my button").click()
        self.page.locator("text=my button").click()

        assert self.console.log.lines[-2:] == ["clicked!", "clicked!"]

    def test_deprecated_element(self):
        self.pyscript_run(
            """
            <py-button label="my button">
                import js
                def on_click(evt):
                    js.console.log('clicked!')
            </py-button>
        """
        )
        banner = self.page.locator(".py-warning")
        banner_content = banner.inner_text()
        expected = (
            "The element <py-button> is deprecated, create a function with your "
            'inline code and use <button py-click="function()" class="py-button"> instead.'
        )

        assert banner_content == expected

    def test_creates_single_deprecation_banner(self):
        self.pyscript_run(
            """
            <py-button label="my button">
                import js
                def on_click(evt):
                    js.console.log('clicked!')
            </py-button>
            <py-button label="another button!">
            </py-button>
        """
        )
        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1
        banner_content = banner[0].inner_text()
        expected = (
            "The element <py-button> is deprecated, create a function with your "
            'inline code and use <button py-click="function()" class="py-button"> instead.'
        )

        assert banner_content == expected
