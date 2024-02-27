import re

import pytest

from .support import PyScriptTest, only_main, skip_worker

DEFAULT_ELEMENT_ATTRIBUTES = {
    "accesskey": "s",
    "autocapitalize": "off",
    "autofocus": True,
    "contenteditable": True,
    "draggable": True,
    "enterkeyhint": "go",
    "hidden": False,
    "id": "whateverid",
    "lang": "br",
    "nonce": "123",
    "part": "part1:exposed1",
    "popover": True,
    "slot": "slot1",
    "spellcheck": False,
    "tabindex": 3,
    "title": "whatevertitle",
    "translate": "no",
    "virtualkeyboardpolicy": "manual",
}


class TestElements(PyScriptTest):
    def _create_el_and_basic_asserts(
        self, el_type, el_text=None, properties=None, check_click=True
    ):
        if not properties:
            properties = {}

        def parse_value(v):
            if isinstance(v, bool):
                return str(v)

            return f"'{v}'"

        attributes = ""
        if el_text:
            attributes += f'"{el_text}",'

        if properties:
            attributes += ", ".join(
                [f"{k}={parse_value(v)}" for k, v in properties.items()]
            )

        body = self.page.locator("body")
        assert body.inner_html() == ""
        element = self.page.locator(el_type)
        assert not element.count()
        code_ = f"""
            <script type="py">
                from pyscript import when
                from pyweb import pydom
                from pyweb.ui.elements import {el_type}
                el = {el_type}({attributes})
                when("click", el)(lambda e: pydom.body.append("{el_type} clicked"))
                pydom.body.append(el)
            </script>
            """
        self.pyscript_run(code_)

        expected_log = f"{el_type} clicked"
        el = self.page.locator(el_type)
        tag = el.evaluate("node => node.tagName")
        assert tag == el_type.upper()
        if el_text:
            assert el.inner_html() == el_text
        assert self.console.error.lines == []
        assert expected_log not in self.console.log.lines == []

        # Click the link
        if check_click:
            el.click()
            assert expected_log not in self.console.log.lines == []

        if properties:
            for k, v in properties.items():
                actual_val = el.evaluate(f"node => node.{k}")
                assert actual_val == v
        return el

    def test_element_a(self):
        body = self.page.locator("body")
        assert body.inner_html() == ""
        element = self.page.locator("a")
        assert not element.count()
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import when
                from pyweb import pydom
                from pyweb.ui.elements import a
                el = a("click me", href="#")
                when("click", el)(lambda e: pydom.body.append("clicked"))
                pydom.body.append(el)
            </script>
            """
        )

        a = self.page.locator("a")
        assert a.inner_html() == "click me"
        assert self.console.error.lines == []
        assert "clicked" not in self.console.log.lines == []

        # Click the link
        a.click()
        assert "clicked" not in self.console.log.lines == []

    def test_abbr(self):
        abbr = self._create_el_and_basic_asserts("abbr", "some text")
        assert abbr.text_content() == "some text"

    def test_address(self):
        address = self._create_el_and_basic_asserts("address", "some text")
        assert address.text_content() == "some text"

    def test_area(self):
        properties = {
            "shape": "poly",
            "coords": "129,0,260,95,129,138",
            "href": "https://developer.mozilla.org/docs/Web/HTTP",
            "target": "_blank",
            "alt": "HTTP",
        }
        # TODO: Check why click times out
        area = self._create_el_and_basic_asserts(
            "area", properties=properties, check_click=False
        )

    def test_element_button(self):
        button = self._create_el_and_basic_asserts("button", "click me")
        assert button.inner_html() == "click me"

    def test_element_button_attributes(self):
        button = self._create_el_and_basic_asserts("button", "click me", None)
        assert button.inner_html() == "click me"

    def test_element_div(self):
        div = self._create_el_and_basic_asserts("div", "click me")
        assert div.inner_html() == "click me"
