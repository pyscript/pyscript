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
