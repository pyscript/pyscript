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
        self,
        el_type,
        el_text=None,
        properties=None,
        expected_errors=None,
        additional_selector_rules=None,
    ):
        expected_errors = expected_errors or []
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
                pydom.body.append(el)
            </script>
            """
        self.pyscript_run(code_)

        # Let's keep the tag in 2 variables, one for the selector and another to
        # check the return tag from the selector
        locator_type = el_tag = el_type[:-1] if el_type.endswith("_") else el_type
        if additional_selector_rules:
            locator_type += f"{additional_selector_rules}"

        el = self.page.locator(locator_type)
        tag = el.evaluate("node => node.tagName")
        assert tag == el_tag.upper()
        if el_text:
            assert el.inner_html() == el_text
            assert el.text_content() == el_text

        # if we expect specific errors, check that they are in the console
        if expected_errors:
            for error in expected_errors:
                assert error in self.console.error.lines
        else:
            # if we don't expect errors, check that there are no errors
            assert self.console.error.lines == []

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
        self._create_el_and_basic_asserts("area", properties=properties)

    def test_article(self):
        self._create_el_and_basic_asserts("article", "some text")

    def test_aside(self):
        self._create_el_and_basic_asserts("aside", "some text")

    def test_audio(self):
        self._create_el_and_basic_asserts(
            "audio",
            properties={"src": "http://localhost:8080/somefile.ogg", "controls": True},
            expected_errors=[
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ],
        )

    def test_b(self):
        self._create_el_and_basic_asserts("aside", "some text")

    def test_blockquote(self):
        self._create_el_and_basic_asserts("blockquote", "some text")

    def test_br(self):
        self._create_el_and_basic_asserts("br")

    def test_element_button(self):
        button = self._create_el_and_basic_asserts("button", "click me")
        assert button.inner_html() == "click me"

    def test_element_button_attributes(self):
        button = self._create_el_and_basic_asserts("button", "click me", None)
        assert button.inner_html() == "click me"

    def test_canvas(self):
        properties = {
            "height": 100,
            "width": 120,
        }
        # TODO: Check why click times out
        self._create_el_and_basic_asserts(
            "canvas", "alt text for canvas", properties=properties
        )

    def test_caption(self):
        self._create_el_and_basic_asserts("caption", "some text")

    def test_cite(self):
        self._create_el_and_basic_asserts("cite", "some text")

    def test_code(self):
        self._create_el_and_basic_asserts("code", "import pyweb")

    def test_data(self):
        self._create_el_and_basic_asserts(
            "data", "some text", properties={"value": "123"}
        )

    def test_datalist(self):
        self._create_el_and_basic_asserts("datalist", "some items")

    def test_dd(self):
        self._create_el_and_basic_asserts("dd", "some text")

    def test_del_(self):
        self._create_el_and_basic_asserts(
            "del_", "some text", properties={"cite": "http://example.com/"}
        )

    def test_details(self):
        self._create_el_and_basic_asserts(
            "details", "some text", properties={"open": True}
        )

    def test_dialog(self):
        self._create_el_and_basic_asserts(
            "dialog", "some text", properties={"open": True}
        )

    def test_div(self):
        div = self._create_el_and_basic_asserts("div", "click me")
        assert div.inner_html() == "click me"

    def test_dl(self):
        self._create_el_and_basic_asserts("dl", "some text")

    def test_dt(self):
        self._create_el_and_basic_asserts("dt", "some text")

    def test_em(self):
        self._create_el_and_basic_asserts("em", "some text")

    def test_embed(self):
        # NOTE: Types actually matter and embed expects a string for height and width
        #       while other elements expect an int

        # TODO: It's important that we add typing soon to help with the user experience
        properties = {
            "src": "http://localhost:8080/somefile.ogg",
            "type": "video/ogg",
            "width": "250",
            "height": "200",
        }
        self._create_el_and_basic_asserts(
            "embed",
            properties=properties,
            expected_errors=[
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ],
        )

    def test_fieldset(self):
        self._create_el_and_basic_asserts(
            "fieldset", "some text", properties={"name": "some name"}
        )

    def test_figcaption(self):
        self._create_el_and_basic_asserts("figcaption", "some text")

    def test_figure(self):
        self._create_el_and_basic_asserts("figure", "some text")

    def test_footer(self):
        self._create_el_and_basic_asserts("footer", "some text")

    def test_form(self):
        properties = {
            "action": "https://example.com/submit",
            "method": "post",
            "name": "some name",
            "autocomplete": "on",
            "rel": "external",
        }
        self._create_el_and_basic_asserts("form", "some text", properties=properties)

    def test_h1(self):
        self._create_el_and_basic_asserts("h1", "some text")

    def test_h2(self):
        self._create_el_and_basic_asserts("h2", "some text")

    def test_h3(self):
        self._create_el_and_basic_asserts("h3", "some text")

    def test_h4(self):
        self._create_el_and_basic_asserts("h4", "some text")

    def test_h5(self):
        self._create_el_and_basic_asserts("h5", "some text")

    def test_h6(self):
        self._create_el_and_basic_asserts("h6", "some text")

    def test_header(self):
        self._create_el_and_basic_asserts("header", "some text")

    def test_hgroup(self):
        self._create_el_and_basic_asserts("hgroup", "some text")

    def test_hr(self):
        self._create_el_and_basic_asserts("hr")

    def test_i(self):
        self._create_el_and_basic_asserts("i", "some text")

    def test_iframe(self):
        # TODO: same comment about defining the right types
        properties = {
            "src": "http://localhost:8080/somefile.html",
            "width": "250",
            "height": "200",
        }
        self._create_el_and_basic_asserts(
            "iframe",
            properties=properties,
            expected_errors=[
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ],
        )

    def test_img(self):
        properties = {
            "src": "http://localhost:8080/somefile.png",
            "alt": "some image",
            "width": 250,
            "height": 200,
        }
        self._create_el_and_basic_asserts(
            "img",
            properties=properties,
            expected_errors=[
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ],
        )

    def test_input(self):
        # TODO: we need multiple input tests
        properties = {
            "type": "text",
            "value": "some value",
            "name": "some name",
            "autofocus": True,
            "disabled": False,
            "maxlength": "10",
            "minlength": "5",
            "pattern": "[A-Za-z]{3}",
            "placeholder": "some placeholder",
            "readonly": False,
            "required": True,
            "size": 20,
        }
        self._create_el_and_basic_asserts("input_", properties=properties)

    def test_ins(self):
        self._create_el_and_basic_asserts(
            "ins", "some text", properties={"cite": "http://example.com/"}
        )

    def test_kbd(self):
        self._create_el_and_basic_asserts("kbd", "some text")

    def test_label(self):
        self._create_el_and_basic_asserts("label", "some text")

    def test_legend(self):
        self._create_el_and_basic_asserts("legend", "some text")

    def test_li(self):
        self._create_el_and_basic_asserts("li", "some text")

    def test_link(self):
        properties = {
            "href": "http://localhost:8080/somefile.css",
            "rel": "stylesheet",
            "type": "text/css",
        }
        self._create_el_and_basic_asserts(
            "link",
            properties=properties,
            expected_errors=[
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ],
            additional_selector_rules="[href='http://localhost:8080/somefile.css']",
        )

    def test_main(self):
        self._create_el_and_basic_asserts("main", "some text")

    def test_map(self):
        self._create_el_and_basic_asserts(
            "map_", "some text", properties={"name": "somemap"}
        )

    def test_mark(self):
        self._create_el_and_basic_asserts("mark", "some text")

    def test_menu(self):
        self._create_el_and_basic_asserts("menu", "some text")

    def test_meter(self):
        properties = {
            "value": 50,
            "min": 0,
            "max": 100,
            "low": 30,
            "high": 80,
            "optimum": 50,
        }
        self._create_el_and_basic_asserts("meter", "some text", properties=properties)

    def test_nav(self):
        self._create_el_and_basic_asserts("nav", "some text")

    def test_object(self):
        properties = {
            "data": "http://localhost:8080/somefile.swf",
            "type": "application/x-shockwave-flash",
            "width": "250",
            "height": "200",
        }
        self._create_el_and_basic_asserts(
            "object_",
            properties=properties,
        )

    def test_ol(self):
        self._create_el_and_basic_asserts("ol", "some text")

    def test_optgroup(self):
        self._create_el_and_basic_asserts(
            "optgroup", "some text", properties={"label": "some label"}
        )

    def test_option(self):
        self._create_el_and_basic_asserts(
            "option", "some text", properties={"value": "some value"}
        )

    def test_output(self):
        self._create_el_and_basic_asserts("output", "some text")

    def test_p(self):
        self._create_el_and_basic_asserts("p", "some text")

    def test_picture(self):
        self._create_el_and_basic_asserts("picture", "some text")

    def test_pre(self):
        self._create_el_and_basic_asserts("pre", "some text")

    def test_progress(self):
        properties = {
            "value": 50,
            "max": 100,
        }
        self._create_el_and_basic_asserts(
            "progress", "some text", properties=properties
        )

    def test_q(self):
        self._create_el_and_basic_asserts(
            "q", "some text", properties={"cite": "http://example.com/"}
        )

    def test_s(self):
        self._create_el_and_basic_asserts("s", "some text")

    # def test_script(self):
    #     self._create_el_and_basic_asserts("script", "some text")

    def test_section(self):
        self._create_el_and_basic_asserts("section", "some text")

    def test_select(self):
        self._create_el_and_basic_asserts("select", "some text")

    def test_small(self):
        self._create_el_and_basic_asserts("small", "some text")

    def test_source(self):
        properties = {
            "src": "http://localhost:8080/somefile.ogg",
            "type": "audio/ogg",
        }
        self._create_el_and_basic_asserts(
            "source",
            properties=properties,
            # expected_errors=[
            #     "Failed to load resource: the server responded with a status of 404 (File not found)"
            # ],
        )

    def test_span(self):
        self._create_el_and_basic_asserts("span", "some text")

    def test_strong(self):
        self._create_el_and_basic_asserts("strong", "some text")

    def test_style(self):
        self._create_el_and_basic_asserts(
            "style",
            "body {background-color: red;}",
        )

    def test_sub(self):
        self._create_el_and_basic_asserts("sub", "some text")

    def test_summary(self):
        self._create_el_and_basic_asserts("summary", "some text")

    def test_sup(self):
        self._create_el_and_basic_asserts("sup", "some text")

    def test_table(self):
        self._create_el_and_basic_asserts("table", "some text")

    def test_tbody(self):
        self._create_el_and_basic_asserts("tbody", "some text")

    def test_td(self):
        self._create_el_and_basic_asserts("td", "some text")

    def test_template(self):
        # We are not checking the content of template since it's sort of
        # special element
        self._create_el_and_basic_asserts("template")

    def test_textarea(self):
        self._create_el_and_basic_asserts("textarea", "some text")

    def test_tfoot(self):
        self._create_el_and_basic_asserts("tfoot", "some text")

    def test_th(self):
        self._create_el_and_basic_asserts("th", "some text")

    def test_thead(self):
        self._create_el_and_basic_asserts("thead", "some text")

    def test_time(self):
        properties = {
            "datetime": "2021-07-01",
        }
        self._create_el_and_basic_asserts("time", "some text", properties=properties)

    def test_title(self):
        self._create_el_and_basic_asserts("title", "some text")

    def test_tr(self):
        self._create_el_and_basic_asserts("tr", "some text")

    def test_track(self):
        properties = {
            "src": "http://localhost:8080/somefile.vtt",
            "kind": "subtitles",
            "srclang": "en",
            "label": "English",
        }
        self._create_el_and_basic_asserts(
            "track",
            properties=properties,
            # expected_errors=[
            #     "Failed to load resource: the server responded with a status of 404 (File not found)"
            # ],
        )

    def test_u(self):
        self._create_el_and_basic_asserts("u", "some text")

    def test_ul(self):
        self._create_el_and_basic_asserts("ul", "some text")

    def test_var(self):
        self._create_el_and_basic_asserts("var", "some text")

    def test_video(self):
        properties = {
            "src": "http://localhost:8080/somefile.ogg",
            "controls": True,
            "width": 250,
            "height": 200,
        }
        self._create_el_and_basic_asserts(
            "video",
            properties=properties,
            expected_errors=[
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ],
        )
