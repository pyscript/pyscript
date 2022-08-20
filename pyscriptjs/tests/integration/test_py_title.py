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
