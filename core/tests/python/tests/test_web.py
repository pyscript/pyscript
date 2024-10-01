"""
Tests for the pyscript.web module.
"""

import asyncio

import upytest

from pyscript import RUNNING_IN_WORKER, document, web, when


def setup():
    container = web.page.find("#test-element-container")[0]
    container.innerHTML = ""


def teardown():
    container = web.page.find("#test-element-container")[0]
    container.innerHTML = ""


def test_getitem_by_id():
    """
    An element with an id in the DOM can be retrieved by id.
    """
    result = web.page.find("#div-no-classes")
    # There is a single result.
    assert len(result) == 1
    # The result is a div.
    assert result[0].get_tag_name() == "div"


def test_getitem_by_class():
    ids = [
        "test_class_selector",
        "test_selector_w_children",
        "test_selector_w_children_child_1",
    ]
    expected_class = "a-test-class"
    result = web.page.find(f".{expected_class}")

    # EXPECT to find exact number of elements with the class in the page (== 3)
    assert len(result) == 3

    # EXPECT that all element ids are in the expected list
    assert [el.id for el in result] == ids


def test_read_n_write_collection_elements():
    elements = web.page.find(".multi-elems")

    for element in elements:
        assert element.innerHTML == f"Content {element.id.replace('#', '')}"

    new_content = "New Content"
    elements.innerHTML = new_content
    for element in elements:
        assert element.innerHTML == new_content


class TestElement:

    def test_query(self):
        # GIVEN an existing element on the page, with at least 1 child element
        id_ = "test_selector_w_children"
        parent_div = web.page.find(f"#{id_}")[0]

        # EXPECT it to be able to query for the first child element
        div = parent_div.find("div")[0]

        # EXPECT the new element to be associated with the parent
        assert (
            div.parent.id == parent_div.id
        ), f"The parent of the new element should be the parent div, but got {div.parent} instead of {parent_div}"
        # EXPECT the new element to be an Element
        assert isinstance(div, web.Element), "The new element should be an Element"
        # EXPECT the div attributes to be == to how they are configured in the page
        assert (
            div.innerHTML == "Child 1"
        ), f"The innerHTML of the div should be 'Child 1', but got {div.innerHTML}"
        assert (
            div.id == "test_selector_w_children_child_1"
        ), f"The id of the div should be 'test_selector_w_children_child_1', but got {div.id}"

    def test_equality(self):
        # GIVEN 2 different Elements pointing to the same underlying element
        id_ = "test_id_selector"
        selector = f"#{id_}"
        div = web.page.find(selector)[0]
        div2 = web.page.find(selector)[0]

        # EXPECT them to be equal
        assert div.id == div2.id
        # EXPECT them to be different objects
        assert div is not div2

        # EXPECT their value to always be equal
        assert div.innerHTML == div2.innerHTML
        div.innerHTML = "some value"

        assert div.innerHTML == div2.innerHTML == "some value"

    def test_append_element(self):
        id_ = "element-append-tests"
        div = web.page.find(f"#{id_}")[0]
        len_children_before = len(div.children)
        new_el = web.p("new element")
        div.append(new_el)
        assert len(div.children) == len_children_before + 1
        assert div.children[-1].id == new_el.id

    def test_append_dom_element_element(self):
        id_ = "element-append-tests"
        div = web.page.find(f"#{id_}")[0]
        len_children_before = len(div.children)
        new_el = web.p("new element")
        div.append(new_el._dom_element)
        assert len(div.children) == len_children_before + 1
        assert div.children[-1].id == new_el.id

    def test_append_collection(self):
        id_ = "element-append-tests"
        div = web.page.find(f"#{id_}")[0]
        len_children_before = len(div.children)
        collection = web.page.find(".collection")
        div.append(collection)
        assert len(div.children) == len_children_before + len(collection)

        for i in range(len(collection)):
            assert div.children[-1 - i].id == collection[-1 - i].id

    def test_read_classes(self):
        id_ = "test_class_selector"
        expected_class = "a-test-class"
        div = web.page.find(f"#{id_}")[0]
        assert div.classes == [expected_class]

    def test_add_remove_class(self):
        id_ = "div-no-classes"
        classname = "tester-class"
        div = web.page.find(f"#{id_}")[0]
        assert not div.classes
        div.classes.add(classname)
        same_div = web.page.find(f"#{id_}")[0]
        assert div.classes == [classname] == same_div.classes
        div.classes.remove(classname)
        assert div.classes == [] == same_div.classes

    async def test_when_decorator(self):
        called = False

        just_a_button = web.page.find("#a-test-button")[0]
        call_flag = asyncio.Event()

        @when("click", just_a_button)
        def on_click(event):
            nonlocal called
            called = True
            call_flag.set()

        # Now let's simulate a click on the button (using the low level JS API)
        # so we don't risk dom getting in the way
        assert not called
        just_a_button._dom_element.click()
        await call_flag.wait()
        assert called

    def test_inner_html_attribute(self):
        # GIVEN an existing element on the page with a known empty text content
        div = web.page.find("#element_attribute_tests")[0]

        # WHEN we set the html attribute
        div.innerHTML = "<b>New Content</b>"

        # EXPECT the element html and underlying JS Element innerHTML property
        # to match what we expect and what
        assert div.innerHTML == div._dom_element.innerHTML == "<b>New Content</b>"
        assert div.textContent == div._dom_element.textContent == "New Content"

    def test_text_attribute(self):
        # GIVEN an existing element on the page with a known empty text content
        div = web.page.find("#element_attribute_tests")[0]

        # WHEN we set the html attribute
        div.textContent = "<b>New Content</b>"

        # EXPECT the element html and underlying JS Element innerHTML property
        # to match what we expect and what
        assert (
            div.innerHTML
            == div._dom_element.innerHTML
            == "&lt;b&gt;New Content&lt;/b&gt;"
        )
        assert div.textContent == div._dom_element.textContent == "<b>New Content</b>"


class TestCollection:

    def test_iter_eq_children(self):
        elements = web.page.find(".multi-elems")
        assert [el for el in elements] == [el for el in elements.elements]
        assert len(elements) == 3

    def test_slices(self):
        elements = web.page.find(".multi-elems")
        assert elements[0]
        _slice = elements[:2]
        assert len(_slice) == 2
        for i, el in enumerate(_slice):
            assert el == elements[i]
        assert elements[:] == elements

    def test_style_rule(self):
        selector = ".multi-elems"
        elements = web.page.find(selector)
        for el in elements:
            assert el.style["background-color"] != "red"

        elements.style["background-color"] = "red"

        for i, el in enumerate(web.page.find(selector)):
            assert elements[i].style["background-color"] == "red"
            assert el.style["background-color"] == "red"

        elements.style.remove("background-color")

        for i, el in enumerate(web.page.find(selector)):
            assert el.style["background-color"] != "red"
            assert elements[i].style["background-color"] != "red"

    async def test_when_decorator(self):
        called = False
        call_flag = asyncio.Event()

        buttons_collection = web.page.find("button")

        @when("click", buttons_collection)
        def on_click(event):
            nonlocal called
            called = True
            call_flag.set()

        # Now let's simulate a click on the button (using the low level JS API)
        # so we don't risk dom getting in the way
        assert not called
        for button in buttons_collection:
            button._dom_element.click()
            await call_flag.wait()
            assert called
            called = False
            call_flag.clear()


class TestCreation:

    def test_create_document_element(self):
        # TODO: This test should probably be removed since it's testing the elements
        # module.
        new_el = web.div("new element")
        new_el.id = "new_el_id"
        assert isinstance(new_el, web.Element)
        assert new_el._dom_element.tagName == "DIV"
        # EXPECT the new element to be associated with the document
        assert new_el.parent is None
        web.page.body.append(new_el)

        assert web.page.find("#new_el_id")[0].parent.tagName == web.page.body.tagName

    def test_create_element_child(self):
        selector = "#element-creation-test"
        parent_div = web.page.find(selector)[0]

        # Creating an element from another element automatically creates that element
        # as a child of the original element
        new_el = web.p(
            "a div",
            classes=["code-description"],
            innerHTML="Ciao PyScripters!",
            id="test-new-el",
        )
        parent_div.append(new_el)

        assert isinstance(new_el, web.Element)
        assert new_el._dom_element.tagName == "P"

        # EXPECT the new element to be associated with the document
        assert new_el.parent.id == parent_div.id
        assert web.page.find(selector)[0].children[0].id == new_el.id


class TestInput:

    input_ids = [
        "test_rr_input_text",
        "test_rr_input_button",
        "test_rr_input_email",
        "test_rr_input_password",
    ]

    def test_value(self):
        for id_ in self.input_ids:
            expected_type = id_.split("_")[-1]
            result = web.page.find(f"#{id_}")
            input_el = result[0]
            assert input_el._dom_element.type == expected_type
            assert (
                input_el.value == f"Content {id_}" == input_el._dom_element.value
            ), f"Expected '{input_el.value}' to be 'Content {id_}' to be '{input_el._dom_element.value}'"

            # Check that we can set the value
            new_value = f"New Value {expected_type}"
            input_el.value = new_value
            assert input_el.value == new_value

            # Check that we can set the value back to the original using
            # the collection
            new_value = f"Content {id_}"
            result.value = new_value
            assert input_el.value == new_value

    def test_set_value_collection(self):
        for id_ in self.input_ids:
            input_el = web.page.find(f"#{id_}")

            assert input_el.value[0] == f"Content {id_}" == input_el[0].value

            new_value = f"New Value {id_}"
            input_el.value = new_value
            assert (
                input_el.value[0] == new_value == input_el[0].value
            ), f"Expected '{input_el.value}' to be 'Content {id_}' to be '{input_el._dom_element.value}'"

            new_value = f"Content {id_}"
            input_el.value = new_value

    # TODO: We only attach attributes to the classes that have them now which means we
    # would have to have some other way to help users if using attributes that aren't
    # actually on the class. Maybe a job for  __setattr__?
    #
    # def test_element_without_value(self):
    #     result = web.page.find(f"#tests-terminal"][0]
    #     with upytest.raises(AttributeError):
    #         result.value = "some value"
    #
    # def test_element_without_value_via_collection(self):
    #     result = web.page.find(f"#tests-terminal"]
    #     with upytest.raises(AttributeError):
    #         result.value = "some value"


class TestSelect:

    def test_select_options_iter(self):
        select = web.page.find(f"#test_select_element_w_options")[0]

        for i, option in enumerate(select.options, 1):
            assert option.value == f"{i}"
            assert option.innerHTML == f"Option {i}"

    def test_select_options_len(self):
        select = web.page.find(f"#test_select_element_w_options")[0]
        assert len(select.options) == 2

    def test_select_options_clear(self):
        select = web.page.find(f"#test_select_element_to_clear")[0]
        assert len(select.options) == 3

        select.options.clear()

        assert len(select.options) == 0

    def test_select_element_add(self):
        # GIVEN the existing select element with no options
        select = web.page.find(f"#test_select_element")[0]

        # EXPECT the select element to have no options
        assert len(select.options) == 0

        # WHEN we add an option
        select.options.add(value="1", html="Option 1")

        # EXPECT the select element to have 1 option matching the attributes
        # we passed in
        assert len(select.options) == 1
        assert select.options[0].value == "1"
        assert select.options[0].innerHTML == "Option 1"

        # WHEN we add another option (blank this time)
        select.options.add("")

        # EXPECT the select element to have 2 options
        assert len(select.options) == 2

        # EXPECT the last option to have an empty value and html
        assert select.options[1].value == ""
        assert select.options[1].innerHTML == ""

        # WHEN we add another option (this time adding it in between the other 2
        # options by using an integer index)
        select.options.add(value="2", html="Option 2", before=1)

        # EXPECT the select element to have 3 options
        assert len(select.options) == 3

        # EXPECT the middle option to have the value and html we passed in
        assert select.options[0].value == "1"
        assert select.options[0].innerHTML == "Option 1"
        assert select.options[1].value == "2"
        assert select.options[1].innerHTML == "Option 2"
        assert select.options[2].value == ""
        assert select.options[2].innerHTML == ""

        # WHEN we add another option (this time adding it in between the other 2
        # options but using the option itself)
        select.options.add(
            value="3", html="Option 3", before=select.options[2], selected=True
        )

        # EXPECT the select element to have 3 options
        assert len(select.options) == 4

        # EXPECT the middle option to have the value and html we passed in
        assert select.options[0].value == "1"
        assert select.options[0].innerHTML == "Option 1"
        assert (
            select.options[0].selected
            == select.options[0]._dom_element.selected
            == False
        )
        assert select.options[1].value == "2"
        assert select.options[1].innerHTML == "Option 2"
        assert select.options[2].value == "3"
        assert select.options[2].innerHTML == "Option 3"
        assert (
            select.options[2].selected
            == select.options[2]._dom_element.selected
            == True
        )
        assert select.options[3].value == ""
        assert select.options[3].innerHTML == ""

        # WHEN we add another option (this time adding it in between the other 2
        # options but using the JS element of the option itself)
        select.options.add(
            value="2a", html="Option 2a", before=select.options[2]._dom_element
        )

        # EXPECT the select element to have 3 options
        assert len(select.options) == 5

        # EXPECT the middle option to have the value and html we passed in
        assert select.options[0].value == "1"
        assert select.options[0].innerHTML == "Option 1"
        assert select.options[1].value == "2"
        assert select.options[1].innerHTML == "Option 2"
        assert select.options[2].value == "2a"
        assert select.options[2].innerHTML == "Option 2a"
        assert select.options[3].value == "3"
        assert select.options[3].innerHTML == "Option 3"
        assert select.options[4].value == ""
        assert select.options[4].innerHTML == ""

    def test_select_options_remove(self):
        # GIVEN the existing select element with 3 options
        select = web.page.find(f"#test_select_element_to_remove")[0]

        # EXPECT the select element to have 3 options
        assert len(select.options) == 4
        # EXPECT the options to have the values originally set
        assert select.options[0].value == "1"
        assert select.options[1].value == "2"
        assert select.options[2].value == "3"
        assert select.options[3].value == "4"

        # WHEN we remove the second option (index starts at 0)
        select.options.remove(1)

        # EXPECT the select element to have 2 options
        assert len(select.options) == 3
        # EXPECT the options to have the values originally set but the second
        assert select.options[0].value == "1"
        assert select.options[1].value == "3"
        assert select.options[2].value == "4"

    def test_select_get_selected_option(self):
        # GIVEN the existing select element with one selected option
        select = web.page.find(f"#test_select_element_w_options")[0]

        # WHEN we get the selected option
        selected_option = select.options.selected

        # EXPECT the selected option to be correct
        assert selected_option.value == "2"
        assert selected_option.innerHTML == "Option 2"
        assert selected_option.selected == selected_option._dom_element.selected == True


class TestElements:
    """
    This class tests all elements in the pyweb.ui.elements module. It creates
    an element of each type, both executing in the main thread and in a worker.
    It runs each test for each interpreter defined in `INTERPRETERS`

    Each individual element test looks for the element properties, sets a value
    on each the supported properties and checks if the element was created correctly
    and all it's properties were set correctly.
    """

    def __init__(self):
        # This module's setup function ensures self.container is empty.
        self.container = web.page.find("#test-element-container")[0]

    def _create_el_and_basic_asserts(
        self,
        el_type,
        el_text=None,
        properties=None,
        additional_selector_rules=None,
    ):
        """
        Create an element with all its properties set then check if the
        element was created correctly and all its properties were set correctly.
        """
        if not properties:
            properties = {}

        def parse_value(v):
            if isinstance(v, bool):
                return str(v)

            return f"{v}"

        args = []
        kwargs = {}
        if el_text:
            args.append(el_text)

        if properties:
            kwargs = {k: parse_value(v) for k, v in properties.items()}

        # Let's make sure the target div to contain the element is empty.
        container = web.page["#test-element-container"][0]
        container.innerHTML = ""
        assert container.innerHTML == "", container.innerHTML

        # Let's create the element
        try:
            klass = getattr(web, el_type)
            el = klass(*args, **kwargs)
            container.append(el)
        except Exception as e:
            assert False, f"Failed to create element {el_type}: {e}"

        # Let's keep the tag in 2 variables, one for the selector and another to
        # check the return tag from the selector
        locator_type = el_tag = el_type[:-1] if el_type.endswith("_") else el_type
        if additional_selector_rules:
            locator_type += f"{additional_selector_rules}"

        el = container.find(locator_type)[0]
        el.tagName == el_tag.upper()
        if el_text:
            assert (
                el.innerHTML == el_text
            ), f"In {el.tagName}, expected {el_text} but got {el.innerHTML}"
            assert el.textContent == el_text

        if properties:
            for k, v in properties.items():
                assert v == getattr(el, k), f"{k} should be {v} but is {getattr(el, k)}"
        return el

    def test_a(self):
        a = self._create_el_and_basic_asserts("a", "click me")
        assert a.textContent == "click me"

    def test_abbr(self):
        abbr = self._create_el_and_basic_asserts("abbr", "some text")
        assert abbr.textContent == "some text"

    def test_address(self):
        address = self._create_el_and_basic_asserts("address", "some text")
        assert address.textContent == "some text"

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
            properties={
                "src": "http://localhost:8080/somefile.ogg",
                "controls": True,
            },
        )

    def test_b(self):
        self._create_el_and_basic_asserts("b", "some text")

    def test_blockquote(self):
        self._create_el_and_basic_asserts("blockquote", "some text")

    def test_br(self):
        self._create_el_and_basic_asserts("br")

    def test_element_button(self):
        button = self._create_el_and_basic_asserts("button", "click me")
        assert button.innerHTML == "click me"

    def test_element_button_attributes(self):
        button = self._create_el_and_basic_asserts("button", "click me", None)
        assert button.innerHTML == "click me"

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
        assert div.innerHTML == "click me"

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
        self._create_el_and_basic_asserts("embed", properties=properties)

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
        self._create_el_and_basic_asserts("iframe", properties=properties)

    @upytest.skip(
        "Flakey on Pyodide in worker.",
        skip_when=RUNNING_IN_WORKER and not upytest.is_micropython,
    )
    async def test_img(self):
        """
        This test contains a bespoke version of the _create_el_and_basic_asserts
        function so we can await asyncio.sleep if in a worker, so the DOM state
        is in sync with the worker before property based asserts can happen.
        """
        properties = {
            "src": "https://picsum.photos/600/400",
            "alt": "some image",
            "width": 250,
            "height": 200,
        }

        def parse_value(v):
            if isinstance(v, bool):
                return str(v)

            return f"{v}"

        args = []
        kwargs = {}

        if properties:
            kwargs = {k: parse_value(v) for k, v in properties.items()}

        # Let's make sure the target div to contain the element is empty.
        container = web.page["#test-element-container"][0]
        container.innerHTML = ""
        assert container.innerHTML == "", container.innerHTML
        # Let's create the element
        try:
            klass = getattr(web, "img")
            el = klass(*args, **kwargs)
            container.append(el)
        except Exception as e:
            assert False, f"Failed to create element img: {e}"

        if RUNNING_IN_WORKER:
            # Needed to sync the DOM with the worker.
            await asyncio.sleep(0.5)

        # Check the img element was created correctly and all its properties
        # were set correctly.
        for k, v in properties.items():
            assert v == getattr(el, k), f"{k} should be {v} but is {getattr(el, k)}"

    def test_input(self):
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
            "value": 50.0,
            "max": 100.0,
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
        self._create_el_and_basic_asserts("time", "some text")

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
        self._create_el_and_basic_asserts("video", properties=properties)

    def test_append_py_element(self):
        div_text_content = "Luke, I am your father"
        p_text_content = "noooooooooo!"
        # Let's create the element
        el = web.div(div_text_content)
        child = web.p(p_text_content)
        el.append(child)
        self.container.append(el)
        # Check the expected content exists.
        result = self.container.find("div")
        assert len(result) == 1
        el = result[0]
        tag = el.tagName
        assert tag == "DIV", tag
        assert el.textContent == f"{div_text_content}{p_text_content}"
        assert len(el.children) == 1, "There should be only 1 child"
        assert el.children[0].tagName == "P"
        assert (
            el.children[0].parentNode.textContent
            == f"{div_text_content}{p_text_content}"
        )
        assert el.children[0].textContent == p_text_content

    def test_append_proxy_element(self):
        div_text_content = "Luke, I am your father"
        p_text_content = "noooooooooo!"
        # Let's create the element
        el = web.div(div_text_content)
        child = document.createElement("P")
        child.textContent = p_text_content
        el.append(child)
        self.container.append(el)
        # Check the expected content exists.
        result = self.container.find("div")
        assert len(result) == 1
        el = result[0]
        tag = el.tagName
        assert tag == "DIV", tag
        assert el.textContent == f"{div_text_content}{p_text_content}", el.textContent
        assert len(el.children) == 1, "There should be only 1 child"
        assert el.children[0].tagName == "P"
        assert (
            el.children[0].parentNode.textContent
            == f"{div_text_content}{p_text_content}"
        )
        assert el.children[0].textContent == p_text_content

    def test_append_py_elementcollection(self):
        div_text_content = "Luke, I am your father"
        p_text_content = "noooooooooo!"
        p2_text_content = "not me!"
        # Let's create the elements
        el = web.div(div_text_content)
        child1 = web.p(p_text_content)
        child2 = web.p(p2_text_content, id="child2")
        collection = web.ElementCollection([child1, child2])
        el.append(collection)
        self.container.append(el)
        # Check the expected content exists.
        result = self.container.find("div")
        assert len(result) == 1
        el = result[0]
        tag = el.tagName
        assert tag == "DIV", tag
        parent_full_content = f"{div_text_content}{p_text_content}{p2_text_content}"
        assert el.textContent == parent_full_content
        assert len(el.children) == 2, "There should be only 2 children"
        assert el.children[0].tagName == "P"
        assert el.children[0].parentNode.textContent == parent_full_content
        assert el.children[0].textContent == p_text_content
        assert el.children[1].tagName == "P"
        assert el.children[1].id == "child2"
        assert el.children[1].parentNode.textContent == parent_full_content
        assert el.children[1].textContent == p2_text_content

    def test_append_js_element_nodelist(self):
        div_text_content = "Luke, I am your father"
        p_text_content = "noooooooooo!"
        p2_text_content = "not me!"
        # Let's create the elements
        el = web.div(div_text_content)
        child1 = web.p(p_text_content)
        child2 = web.p(p2_text_content, id="child2")
        self.container.append(child1)
        self.container.append(child2)
        nodes = self.container._dom_element.querySelectorAll("p")
        el.append(nodes)
        self.container.append(el)
        # Check the expected content exists.
        result = self.container.find("div")
        assert len(result) == 1
        el = result[0]
        tag = el.tagName
        assert tag == "DIV", tag
        parent_full_content = f"{div_text_content}{p_text_content}{p2_text_content}"
        assert el.textContent == parent_full_content, el.innerHTML
        assert len(el.children) == 2, "There should be only 2 children"
        assert el.children[0].tagName == "P"
        assert el.children[0].parentNode.textContent == parent_full_content
        assert el.children[0].textContent == p_text_content
        assert el.children[1].tagName == "P"
        assert el.children[1].id == "child2"
        assert el.children[1].parentNode.textContent == parent_full_content
        assert el.children[1].textContent == p2_text_content
