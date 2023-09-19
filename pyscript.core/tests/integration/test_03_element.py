import pytest

from .support import PyScriptTest


class TestElement(PyScriptTest):
    """Test the Element api"""

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_id(self):
        """Test the element id"""
        self.pyscript_run(
            """
            <div id="foo"></div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            print(el.id)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "foo"

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert "foo" in py_terminal.inner_text()

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_value(self):
        """Test the element value"""
        self.pyscript_run(
            """
            <input id="foo" value="bar">
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            print(el.value)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "bar"

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert "bar" in py_terminal.inner_text()

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_innerHtml(self):
        """Test the element innerHtml"""
        self.pyscript_run(
            """
            <div id="foo"><b>bar</b></div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            print(el.innerHtml)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "<b>bar</b>"

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert "bar" in py_terminal.inner_text()

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_write_no_append(self):
        """Test the element write"""
        self.pyscript_run(
            """
            <div id="foo"></div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.write("Hello!")
            el.write("World!")
            </script>
            """
        )
        div = self.page.wait_for_selector("#foo")
        assert "World!" in div.inner_text()

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_write_append(self):
        """Test the element write"""
        self.pyscript_run(
            """
            <div id="foo"></div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.write("Hello!")
            el.write("World!", append=True)
            </script>
            """
        )
        parent_div = self.page.wait_for_selector("#foo")

        assert "Hello!" in parent_div.inner_text()
        # confirm that the second write was appended
        assert "Hello!<div>World!</div>" in parent_div.inner_html()

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_clear_div(self):
        """Test the element clear"""
        self.pyscript_run(
            """
            <div id="foo">Hello!</div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.clear()
            </script>
            """
        )
        div = self.page.locator("#foo")
        assert div.inner_text() == ""

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_clear_input(self):
        """Test the element clear"""
        self.pyscript_run(
            """
            <input id="foo" value="bar">
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.clear()
            </script>
            """
        )
        input = self.page.wait_for_selector("#foo")
        assert input.input_value() == ""

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_select(self):
        """Test the element select"""
        self.pyscript_run(
            """
            <select id="foo">
                <option value="bar">Bar</option>
            </select>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            js.console.log(el.select("option").value)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "bar"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_select_content(self):
        """Test the element select"""
        self.pyscript_run(
            """
            <template id="foo">
                <div>Bar</div>
            </template>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            js.console.log(el.select("div", from_content=True).innerHtml)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "Bar"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_clone_no_id(self):
        """Test the element clone"""
        self.pyscript_run(
            """
            <div id="foo">Hello!</div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.clone()
            </script>
            """
        )
        divs = self.page.locator("#foo")
        assert divs.count() == 2
        assert divs.first.inner_text() == "Hello!"
        assert divs.last.inner_text() == "Hello!"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_clone_with_id(self):
        """Test the element clone"""
        self.pyscript_run(
            """
            <div id="foo">Hello!</div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.clone(new_id="bar")
            </script>
            """
        )
        divs = self.page.locator("#foo")
        assert divs.count() == 1
        assert divs.inner_text() == "Hello!"

        clone = self.page.locator("#bar")
        assert clone.inner_text() == "Hello!"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_clone_to_other_element(self):
        """Test the element clone"""
        self.pyscript_run(
            """
            <div id="container">
                <div id="bond">
                    Bond
                </div>
                <div id="james">
                    James
                </div>
            </div>
            <script type="py">
                from pyscript import Element

                bond_div = Element("bond")
                james_div = Element("james")

                bond_div.clone(new_id="bond-2", to=james_div)
            </script>
            """
        )
        bond_divs = self.page.locator("#bond")
        james_divs = self.page.locator("#james")
        bond_2_divs = self.page.locator("#bond-2")

        assert bond_divs.count() == 1
        assert james_divs.count() == 1
        assert bond_2_divs.count() == 1

        container_div = self.page.locator("#container")
        # Make sure that the clones are rendered in the right order
        assert container_div.inner_text() == "Bond\nJames\nBond"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_remove_single_class(self):
        """Test the element remove_class"""
        self.pyscript_run(
            """
            <div id="foo" class="bar baz"></div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.remove_class("bar")
            </script>
            """
        )
        div = self.page.locator("#foo")
        assert div.get_attribute("class") == "baz"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_remove_multiple_classes(self):
        """Test the element remove_class"""
        self.pyscript_run(
            """
            <div id="foo" class="foo bar baz"></div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.remove_class(["foo", "baz", "bar"])
            </script>
            """
        )
        div = self.page.locator("#foo")
        assert div.get_attribute("class") == ""

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_add_single_class(self):
        """Test the element add_class"""
        self.pyscript_run(
            """
            <style> .red { color: red; } </style>
            <div id="foo">Hi!</div>
            <script type="py">
            from pyscript import Element
            el = Element("foo")
            el.add_class("red")
            </script>
            """
        )
        div = self.page.locator("#foo")
        assert div.get_attribute("class") == "red"

    @pytest.mark.skip("FIXME: Element interface is gone. Replace with PyDom")
    def test_element_add_multiple_class(self):
        """Test the element add_class"""
        self.pyscript_run(
            """
            <style> .red { color: red; } .bold { font-weight: bold; } </style>
            <div id="foo">Hi!</div>
            <script type="py">
                from pyscript import Element
                el = Element("foo")
                el.add_class(["red", "bold"])
            </script>
            """
        )
        div = self.page.locator("#foo")
        assert div.get_attribute("class") == "red bold"
