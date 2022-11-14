from .support import PyScriptTest


class TestPyTitle(PyScriptTest):
    def test_title_shows_on_page(self):
        self.pyscript_run(
            """
            <py-title>Hello, World!</py-title>
            """
        )

        py_title = self.page.query_selector("py-title")
        # check that we do have py-title in the page, if not
        # py_title will be none
        assert py_title
        assert py_title.text_content() == "Hello, World!"

    def test_deprecated_element(self):
        self.pyscript_run(
            """
            <py-title>Hello, world!</py-title>
        """
        )
        banner = self.page.locator(".py-warning")
        banner_content = banner.inner_text()
        expected = (
            "The element <py-title> is deprecated, please use an <h1> tag instead."
        )

        assert banner_content == expected
