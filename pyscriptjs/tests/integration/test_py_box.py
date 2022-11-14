from .support import PyScriptTest


class TestPyButton(PyScriptTest):
    def test_box(self):
        self.pyscript_run(
            """
            <py-box>
                <py-box>
                </py-box>
            </py-box>
            """
        )

        pybox_element = self.page.query_selector_all("py-box")

        assert len(pybox_element) == 2
        assert pybox_element[1].get_attribute("class") == "py-box-child"

    def test_deprecated_element(self):
        self.pyscript_run(
            """
            <py-box>
            </py-box>
        """
        )
        banner = self.page.locator(".py-warning")
        banner_content = banner.inner_text()
        expected = (
            "The element <py-box> is deprecated, you should create a div "
            'with "py-box" class name instead. For example: <div class="py-box">'
        )

        assert banner_content == expected
