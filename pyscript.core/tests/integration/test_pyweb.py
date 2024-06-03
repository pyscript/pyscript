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

INTERPRETERS = ["py", "mpy"]


@pytest.fixture(params=INTERPRETERS)
def interpreter(request):
    return request.param


class TestElements(PyScriptTest):
    """Test all elements in the pyweb.ui.elements module.

    This class tests all elements in the pyweb.ui.elements module. It creates
    an element of each type, both executing in the main thread and in a worker.
    It runs each test for each interpreter defined in `INTERPRETERS`

    Each individual element test looks for the element properties, sets a value
    on each the supported properties and checks if the element was created correctly
    and all it's properties were set correctly.
    """

    @property
    def expected_missing_file_errors(self):
        # In fake server conditions this test will not throw an error due to missing files.
        # If we want to skip the test, use:
        # pytest.skip("Skipping: fake server doesn't throw 404 errors on missing local files.")
        return (
            [
                "Failed to load resource: the server responded with a status of 404 (File not found)"
            ]
            if self.dev_server
            else []
        )

    def _create_el_and_basic_asserts(
        self,
        el_type,
        el_text=None,
        interpreter="py",
        properties=None,
        expected_errors=None,
        additional_selector_rules=None,
    ):
        """Create an element with all its properties set, by running <script type=<interpreter> ... >
        , and check if the element was created correctly and all its properties were set correctly.
        """
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

        # Let's make sure the body of the page is clean first
        body = self.page.locator("body")
        assert body.inner_html() == ""

        # Let's make sure the element is not in the page
        element = self.page.locator(el_type)
        assert not element.count()

        # Let's create the element
        code_ = f"""
                from pyscript import when
            <script type="{interpreter}">
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

    def test_a(self, interpreter):
        a = self._create_el_and_basic_asserts("a", "click me", interpreter)
        assert a.text_content() == "click me"

    def test_abbr(self, interpreter):
        abbr = self._create_el_and_basic_asserts(
            "abbr", "some text", interpreter=interpreter
        )
        assert abbr.text_content() == "some text"

    def test_address(self, interpreter):
        address = self._create_el_and_basic_asserts("address", "some text", interpreter)
        assert address.text_content() == "some text"

    def test_area(self, interpreter):
        properties = {
            "shape": "poly",
            "coords": "129,0,260,95,129,138",
            "href": "https://developer.mozilla.org/docs/Web/HTTP",
            "target": "_blank",
            "alt": "HTTP",
        }
        # TODO: Check why click times out
        self._create_el_and_basic_asserts(
            "area", interpreter=interpreter, properties=properties
        )

    def test_article(self, interpreter):
        self._create_el_and_basic_asserts("article", "some text", interpreter)

    def test_aside(self, interpreter):
        self._create_el_and_basic_asserts("aside", "some text", interpreter)

    def test_audio(self, interpreter):
        self._create_el_and_basic_asserts(
            "audio",
            interpreter=interpreter,
            properties={"src": "http://localhost:8080/somefile.ogg", "controls": True},
            expected_errors=self.expected_missing_file_errors,
        )

    def test_b(self, interpreter):
        self._create_el_and_basic_asserts("aside", "some text", interpreter)

    def test_blockquote(self, interpreter):
        self._create_el_and_basic_asserts("blockquote", "some text", interpreter)

    def test_br(self, interpreter):
        self._create_el_and_basic_asserts("br", interpreter=interpreter)

    def test_element_button(self, interpreter):
        button = self._create_el_and_basic_asserts("button", "click me", interpreter)
        assert button.inner_html() == "click me"

    def test_element_button_attributes(self, interpreter):
        button = self._create_el_and_basic_asserts(
            "button", "click me", interpreter, None
        )
        assert button.inner_html() == "click me"

    def test_canvas(self, interpreter):
        properties = {
            "height": 100,
            "width": 120,
        }
        # TODO: Check why click times out
        self._create_el_and_basic_asserts(
            "canvas", "alt text for canvas", interpreter, properties=properties
        )

    def test_caption(self, interpreter):
        self._create_el_and_basic_asserts("caption", "some text", interpreter)

    def test_cite(self, interpreter):
        self._create_el_and_basic_asserts("cite", "some text", interpreter)

    def test_code(self, interpreter):
        self._create_el_and_basic_asserts("code", "import pyweb", interpreter)

    def test_data(self, interpreter):
        self._create_el_and_basic_asserts(
            "data", "some text", interpreter, properties={"value": "123"}
        )

    def test_datalist(self, interpreter):
        self._create_el_and_basic_asserts("datalist", "some items", interpreter)

    def test_dd(self, interpreter):
        self._create_el_and_basic_asserts("dd", "some text", interpreter)

    def test_del_(self, interpreter):
        self._create_el_and_basic_asserts(
            "del_", "some text", interpreter, properties={"cite": "http://example.com/"}
        )

    def test_details(self, interpreter):
        self._create_el_and_basic_asserts(
            "details", "some text", interpreter, properties={"open": True}
        )

    def test_dialog(self, interpreter):
        self._create_el_and_basic_asserts(
            "dialog", "some text", interpreter, properties={"open": True}
        )

    def test_div(self, interpreter):
        div = self._create_el_and_basic_asserts("div", "click me", interpreter)
        assert div.inner_html() == "click me"

    def test_dl(self, interpreter):
        self._create_el_and_basic_asserts("dl", "some text", interpreter)

    def test_dt(self, interpreter):
        self._create_el_and_basic_asserts("dt", "some text", interpreter)

    def test_em(self, interpreter):
        self._create_el_and_basic_asserts("em", "some text", interpreter)

    def test_embed(self, interpreter):
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
            interpreter=interpreter,
            properties=properties,
            expected_errors=self.expected_missing_file_errors,
        )

    def test_fieldset(self, interpreter):
        self._create_el_and_basic_asserts(
            "fieldset", "some text", interpreter, properties={"name": "some name"}
        )

    def test_figcaption(self, interpreter):
        self._create_el_and_basic_asserts("figcaption", "some text", interpreter)

    def test_figure(self, interpreter):
        self._create_el_and_basic_asserts("figure", "some text", interpreter)

    def test_footer(self, interpreter):
        self._create_el_and_basic_asserts("footer", "some text", interpreter)

    def test_form(self, interpreter):
        properties = {
            "action": "https://example.com/submit",
            "method": "post",
            "name": "some name",
            "autocomplete": "on",
            "rel": "external",
        }
        self._create_el_and_basic_asserts(
            "form", "some text", interpreter, properties=properties
        )

    def test_h1(self, interpreter):
        self._create_el_and_basic_asserts("h1", "some text", interpreter)

    def test_h2(self, interpreter):
        self._create_el_and_basic_asserts("h2", "some text", interpreter)

    def test_h3(self, interpreter):
        self._create_el_and_basic_asserts("h3", "some text", interpreter)

    def test_h4(self, interpreter):
        self._create_el_and_basic_asserts("h4", "some text", interpreter)

    def test_h5(self, interpreter):
        self._create_el_and_basic_asserts("h5", "some text", interpreter)

    def test_h6(self, interpreter):
        self._create_el_and_basic_asserts("h6", "some text", interpreter)

    def test_header(self, interpreter):
        self._create_el_and_basic_asserts("header", "some text", interpreter)

    def test_hgroup(self, interpreter):
        self._create_el_and_basic_asserts("hgroup", "some text", interpreter)

    def test_hr(self, interpreter):
        self._create_el_and_basic_asserts("hr", interpreter=interpreter)

    def test_i(self, interpreter):
        self._create_el_and_basic_asserts("i", "some text", interpreter)

    def test_iframe(self, interpreter):
        # TODO: same comment about defining the right types
        properties = {
            "src": "http://localhost:8080/somefile.html",
            "width": "250",
            "height": "200",
        }
        self._create_el_and_basic_asserts(
            "iframe",
            interpreter,
            properties=properties,
            expected_errors=self.expected_missing_file_errors,
        )

    def test_img(self, interpreter):
        properties = {
            "src": "http://localhost:8080/somefile.png",
            "alt": "some image",
            "width": 250,
            "height": 200,
        }
        self._create_el_and_basic_asserts(
            "img",
            interpreter=interpreter,
            properties=properties,
            expected_errors=self.expected_missing_file_errors,
        )

    def test_input(self, interpreter):
        # TODO: we need multiple input tests
        properties = {
            "type": "text",
            "value": "some value",
            "name": "some name",
            "autofocus": True,
            "pattern": "[A-Za-z]{3}",
            "placeholder": "some placeholder",
            "required": True,
            "size": 20,
        }
        self._create_el_and_basic_asserts(
            "input_", interpreter=interpreter, properties=properties
        )

    def test_ins(self, interpreter):
        self._create_el_and_basic_asserts(
            "ins", "some text", interpreter, properties={"cite": "http://example.com/"}
        )

    def test_kbd(self, interpreter):
        self._create_el_and_basic_asserts("kbd", "some text", interpreter)

    def test_label(self, interpreter):
        self._create_el_and_basic_asserts("label", "some text", interpreter)

    def test_legend(self, interpreter):
        self._create_el_and_basic_asserts("legend", "some text", interpreter)

    def test_li(self, interpreter):
        self._create_el_and_basic_asserts("li", "some text", interpreter)

    def test_link(self, interpreter):
        properties = {
            "href": "http://localhost:8080/somefile.css",
            "rel": "stylesheet",
            "type": "text/css",
        }
        self._create_el_and_basic_asserts(
            "link",
            interpreter=interpreter,
            properties=properties,
            expected_errors=self.expected_missing_file_errors,
            additional_selector_rules="[href='http://localhost:8080/somefile.css']",
        )

    def test_main(self, interpreter):
        self._create_el_and_basic_asserts("main", "some text", interpreter)

    def test_map(self, interpreter):
        self._create_el_and_basic_asserts(
            "map_", "some text", interpreter, properties={"name": "somemap"}
        )

    def test_mark(self, interpreter):
        self._create_el_and_basic_asserts("mark", "some text", interpreter)

    def test_menu(self, interpreter):
        self._create_el_and_basic_asserts("menu", "some text", interpreter)

    def test_meter(self, interpreter):
        properties = {
            "value": 50,
            "min": 0,
            "max": 100,
            "low": 30,
            "high": 80,
            "optimum": 50,
        }
        self._create_el_and_basic_asserts(
            "meter", "some text", interpreter, properties=properties
        )

    def test_nav(self, interpreter):
        self._create_el_and_basic_asserts("nav", "some text", interpreter)

    def test_object(self, interpreter):
        properties = {
            "data": "http://localhost:8080/somefile.swf",
            "type": "application/x-shockwave-flash",
            "width": "250",
            "height": "200",
        }
        self._create_el_and_basic_asserts(
            "object_",
            interpreter=interpreter,
            properties=properties,
        )

    def test_ol(self, interpreter):
        self._create_el_and_basic_asserts("ol", "some text", interpreter)

    def test_optgroup(self, interpreter):
        self._create_el_and_basic_asserts(
            "optgroup", "some text", interpreter, properties={"label": "some label"}
        )

    def test_option(self, interpreter):
        self._create_el_and_basic_asserts(
            "option", "some text", interpreter, properties={"value": "some value"}
        )

    def test_output(self, interpreter):
        self._create_el_and_basic_asserts("output", "some text", interpreter)

    def test_p(self, interpreter):
        self._create_el_and_basic_asserts("p", "some text", interpreter)

    def test_picture(self, interpreter):
        self._create_el_and_basic_asserts("picture", "some text", interpreter)

    def test_pre(self, interpreter):
        self._create_el_and_basic_asserts("pre", "some text", interpreter)

    def test_progress(self, interpreter):
        properties = {
            "value": 50,
            "max": 100,
        }
        self._create_el_and_basic_asserts(
            "progress", "some text", interpreter, properties=properties
        )

    def test_q(self, interpreter):
        self._create_el_and_basic_asserts(
            "q", "some text", interpreter, properties={"cite": "http://example.com/"}
        )

    def test_s(self, interpreter):
        self._create_el_and_basic_asserts("s", "some text", interpreter)

    # def test_script(self):
    #     self._create_el_and_basic_asserts("script", "some text")

    def test_section(self, interpreter):
        self._create_el_and_basic_asserts("section", "some text", interpreter)

    def test_select(self, interpreter):
        self._create_el_and_basic_asserts("select", "some text", interpreter)

    def test_small(self, interpreter):
        self._create_el_and_basic_asserts("small", "some text", interpreter)

    def test_source(self, interpreter):
        properties = {
            "src": "http://localhost:8080/somefile.ogg",
            "type": "audio/ogg",
        }
        self._create_el_and_basic_asserts(
            "source",
            interpreter=interpreter,
            properties=properties,
        )

    def test_span(self, interpreter):
        self._create_el_and_basic_asserts("span", "some text", interpreter)

    def test_strong(self, interpreter):
        self._create_el_and_basic_asserts("strong", "some text", interpreter)

    def test_style(self, interpreter):
        self._create_el_and_basic_asserts(
            "style",
            "body {background-color: red;}",
            interpreter,
        )

    def test_sub(self, interpreter):
        self._create_el_and_basic_asserts("sub", "some text", interpreter)

    def test_summary(self, interpreter):
        self._create_el_and_basic_asserts("summary", "some text", interpreter)

    def test_sup(self, interpreter):
        self._create_el_and_basic_asserts("sup", "some text", interpreter)

    def test_table(self, interpreter):
        self._create_el_and_basic_asserts("table", "some text", interpreter)

    def test_tbody(self, interpreter):
        self._create_el_and_basic_asserts("tbody", "some text", interpreter)

    def test_td(self, interpreter):
        self._create_el_and_basic_asserts("td", "some text", interpreter)

    def test_template(self, interpreter):
        # We are not checking the content of template since it's sort of
        # special element
        self._create_el_and_basic_asserts("template", interpreter=interpreter)

    def test_textarea(self, interpreter):
        self._create_el_and_basic_asserts("textarea", "some text", interpreter)

    def test_tfoot(self, interpreter):
        self._create_el_and_basic_asserts("tfoot", "some text", interpreter)

    def test_th(self, interpreter):
        self._create_el_and_basic_asserts("th", "some text", interpreter)

    def test_thead(self, interpreter):
        self._create_el_and_basic_asserts("thead", "some text", interpreter)

    def test_time(self, interpreter):
        self._create_el_and_basic_asserts("time", "some text", interpreter)

    def test_title(self, interpreter):
        self._create_el_and_basic_asserts("title", "some text", interpreter)

    def test_tr(self, interpreter):
        self._create_el_and_basic_asserts("tr", "some text", interpreter)

    def test_track(self, interpreter):
        properties = {
            "src": "http://localhost:8080/somefile.vtt",
            "kind": "subtitles",
            "srclang": "en",
            "label": "English",
        }
        self._create_el_and_basic_asserts(
            "track",
            interpreter=interpreter,
            properties=properties,
        )

    def test_u(self, interpreter):
        self._create_el_and_basic_asserts("u", "some text", interpreter)

    def test_ul(self, interpreter):
        self._create_el_and_basic_asserts("ul", "some text", interpreter)

    def test_var(self, interpreter):
        self._create_el_and_basic_asserts("var", "some text", interpreter)

    def test_video(self, interpreter):
        properties = {
            "src": "http://localhost:8080/somefile.ogg",
            "controls": True,
            "width": 250,
            "height": 200,
        }
        self._create_el_and_basic_asserts(
            "video",
            interpreter=interpreter,
            properties=properties,
            expected_errors=self.expected_missing_file_errors,
        )
