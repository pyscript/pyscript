from pyscript import document, when
from pyscript.web import dom
from pyscript.web.elements import ElementCollection
from pyscript.web import elements as el




class TestDocument:
    def test__element(self):
        assert dom.body._dom_element == document.body
        assert dom.head._dom_element == document.head


def test_getitem_by_id():
    # GIVEN an existing element on the page with a known text content
    id_ = "test_id_selector"
    txt = "You found test_id_selector"
    selector = f"#{id_}"
    # EXPECT the element to be found by id
    result = dom.find(selector)
    div = result[0]
    # EXPECT the element text value to match what we expect and what
    # the JS document.querySelector API would return
    assert document.querySelector(selector).innerHTML == div.html == txt
    # EXPECT the results to be of the right types
    assert isinstance(div, el.Element)
    assert isinstance(result, ElementCollection)


def test_getitem_by_class():
    ids = [
        "test_class_selector",
        "test_selector_w_children",
        "test_selector_w_children_child_1",
    ]
    expected_class = "a-test-class"
    result = dom.find(f".{expected_class}")
    div = result[0]

    # EXPECT to find exact number of elements with the class in the page (== 3)
    assert len(result) == 3

    # EXPECT that all element ids are in the expected list
    assert [el.id for el in result] == ids


def test_read_n_write_collection_elements():
    elements = dom.find(".multi-elems")

    for element in elements:
        assert element.html == f"Content {element.id.replace('#', '')}"

    new_content = "New Content"
    elements.html = new_content
    for element in elements:
        assert element.html == new_content


class TestElement:
    def test_query(self):
        # GIVEN an existing element on the page, with at least 1 child element
        id_ = "test_selector_w_children"
        parent_div = dom.find(f"#{id_}")[0]

        # EXPECT it to be able to query for the first child element
        div = parent_div.find("div")[0]

        # EXPECT the new element to be associated with the parent
        assert div.parent == parent_div
        # EXPECT the new element to be a el.Element
        assert isinstance(div, el.Element)
        # EXPECT the div attributes to be == to how they are configured in the page
        assert div.html == "Child 1"
        assert div.id == "test_selector_w_children_child_1"

    def test_equality(self):
        # GIVEN 2 different Elements pointing to the same underlying element
        id_ = "test_id_selector"
        selector = f"#{id_}"
        div = dom.find(selector)[0]
        div2 = dom.find(selector)[0]

        # EXPECT them to be equal
        assert div == div2
        # EXPECT them to be different objects
        assert div is not div2

        # EXPECT their value to always be equal
        assert div.html == div2.html
        div.html = "some value"

        assert div.html == div2.html == "some value"

    def test_append_element(self):
        id_ = "element-append-tests"
        div = dom.find(f"#{id_}")[0]
        len_children_before = len(div.children)
        new_el = el.p("new element")
        div.append(new_el)
        assert len(div.children) == len_children_before + 1
        assert div.children[-1] == new_el

    def test_append_dom_element_element(self):
        id_ = "element-append-tests"
        div = dom.find(f"#{id_}")[0]
        len_children_before = len(div.children)
        new_el = el.p("new element")
        div.append(new_el._dom_element)
        assert len(div.children) == len_children_before + 1
        assert div.children[-1] == new_el

    def test_append_collection(self):
        id_ = "element-append-tests"
        div = dom.find(f"#{id_}")[0]
        len_children_before = len(div.children)
        collection = dom.find(".collection")
        div.append(collection)
        assert len(div.children) == len_children_before + len(collection)

        for i in range(len(collection)):
            assert div.children[-1 - i] == collection[-1 - i]

    def test_read_classes(self):
        id_ = "test_class_selector"
        expected_class = "a-test-class"
        div = dom.find(f"#{id_}")[0]
        assert div.classes == [expected_class]

    def test_add_remove_class(self):
        id_ = "div-no-classes"
        classname = "tester-class"
        div = dom.find(f"#{id_}")[0]
        assert not div.classes
        div.classes.add(classname)
        same_div = dom.find(f"#{id_}")[0]
        assert div.classes == [classname] == same_div.classes
        div.classes.remove(classname)
        assert div.classes == [] == same_div.classes

    def test_when_decorator(self):
        called = False

        just_a_button = dom.find("#a-test-button")[0]

        @when("click", just_a_button)
        def on_click(event):
            nonlocal called
            called = True

        # Now let's simulate a click on the button (using the low level JS API)
        # so we don't risk dom getting in the way
        assert not called
        just_a_button._dom_element.click()

        assert called

    def test_html_attribute(self):
        # GIVEN an existing element on the page with a known empty text content
        div = dom.find("#element_attribute_tests")[0]

        # WHEN we set the html attribute
        div.html = "<b>New Content</b>"

        # EXPECT the element html and underlying JS Element innerHTML property
        # to match what we expect and what
        assert div.html == div._dom_element.innerHTML == "<b>New Content</b>"
        assert div.text == div._dom_element.textContent == "New Content"

    def test_text_attribute(self):
        # GIVEN an existing element on the page with a known empty text content
        div = dom.find("#element_attribute_tests")[0]

        # WHEN we set the html attribute
        div.text = "<b>New Content</b>"

        # EXPECT the element html and underlying JS Element innerHTML property
        # to match what we expect and what
        assert div.html == div._dom_element.innerHTML == "&lt;b&gt;New Content&lt;/b&gt;"
        assert div.text == div._dom_element.textContent == "<b>New Content</b>"


class TestCollection:
    def test_iter_eq_children(self):
        elements = dom.find(".multi-elems")
        assert [el for el in elements] == [el for el in elements.children]
        assert len(elements) == 3

    def test_slices(self):
        elements = dom.find(".multi-elems")
        assert elements[0]
        _slice = elements[:2]
        assert len(_slice) == 2
        for i, el in enumerate(_slice):
            assert el == elements[i]
        assert elements[:] == elements

    def test_style_rule(self):
        selector = ".multi-elems"
        elements = dom.find(selector)
        for el in elements:
            assert el.style["background-color"] != "red"

        elements.style["background-color"] = "red"

        for i, el in enumerate(dom.find(selector)):
            assert elements[i].style["background-color"] == "red"
            assert el.style["background-color"] == "red"

        elements.style.remove("background-color")

        for i, el in enumerate(dom.find(selector)):
            assert el.style["background-color"] != "red"
            assert elements[i].style["background-color"] != "red"

    def test_when_decorator(self):
        called = False

        buttons_collection = dom.find("button")

        @when("click", buttons_collection)
        def on_click(event):
            nonlocal called
            called = True

        # Now let's simulate a click on the button (using the low level JS API)
        # so we don't risk dom getting in the way
        assert not called
        for button in buttons_collection:
            button._dom_element.click()
            assert called
            called = False


class TestCreation:
    def test_create_document_element(self):
        # TODO: This test should probably be removed since it's testing the elements module
        new_el = el.div("new element")
        new_el.id = "new_el_id"
        assert isinstance(new_el, el.Element)
        assert new_el._dom_element.tagName == "DIV"
        # EXPECT the new element to be associated with the document
        assert new_el.parent == None
        dom.body.append(new_el)

        assert dom.find("#new_el_id")[0].parent == dom.body

    def test_create_element_child(self):
        selector = "#element-creation-test"
        parent_div = dom.find(selector)[0]

        # Creating an element from another element automatically creates that element
        # as a child of the original element
        new_el = el.p("a div", classes=["code-description"], html="Ciao PyScripters!")
        parent_div.append(new_el)

        assert isinstance(new_el, el.Element)
        assert new_el._dom_element.tagName == "P"

        # EXPECT the new element to be associated with the document
        assert new_el.parent == parent_div
        assert dom.find(selector)[0].children[0] == new_el


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
            result = dom.find(f"#{id_}")
            input_el = result[0]
            assert input_el._dom_element.type == expected_type
            assert input_el.value == f"Content {id_}" == input_el._dom_element.value

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
            input_el = dom.find(f"#{id_}")

            assert input_el.value[0] == f"Content {id_}" == input_el[0].value

            new_value = f"New Value {id_}"
            input_el.value = new_value
            assert input_el.value[0] == new_value == input_el[0].value

    # TODO: We only attach attributes to the classes that have them now which means we
    # would have to have some other way to help users if using attributes that aren't
    # actually on the class. Maybe a job for  __setattr__?
    #
    # def test_element_without_value(self):
    #     result = dom.find(f"#tests-terminal"][0]
    #     with pytest.raises(AttributeError):
    #         result.value = "some value"
    #
    # def test_element_without_value_via_collection(self):
    #     result = dom.find(f"#tests-terminal"]
    #     with pytest.raises(AttributeError):
    #         result.value = "some value"


class TestSelect:
    def test_select_options_iter(self):
        select = dom.find(f"#test_select_element_w_options")[0]

        for i, option in enumerate(select.options, 1):
            assert option.value == f"{i}"
            assert option.html == f"Option {i}"

    def test_select_options_len(self):
        select = dom.find(f"#test_select_element_w_options")[0]
        assert len(select.options) == 2

    def test_select_options_clear(self):
        select = dom.find(f"#test_select_element_to_clear")[0]
        assert len(select.options) == 3

        select.options.clear()

        assert len(select.options) == 0

    def test_select_element_add(self):
        # GIVEN the existing select element with no options
        select = dom.find(f"#test_select_element")[0]

        # EXPECT the select element to have no options
        assert len(select.options) == 0

        # WHEN we add an option
        select.options.add(value="1", html="Option 1")

        # EXPECT the select element to have 1 option matching the attributes
        # we passed in
        assert len(select.options) == 1
        assert select.options[0].value == "1"
        assert select.options[0].html == "Option 1"

        # WHEN we add another option (blank this time)
        select.options.add("")

        # EXPECT the select element to have 2 options
        assert len(select.options) == 2

        # EXPECT the last option to have an empty value and html
        assert select.options[1].value == ""
        assert select.options[1].html == ""

        # WHEN we add another option (this time adding it in between the other 2
        # options by using an integer index)
        select.options.add(value="2", html="Option 2", before=1)

        # EXPECT the select element to have 3 options
        assert len(select.options) == 3

        # EXPECT the middle option to have the value and html we passed in
        assert select.options[0].value == "1"
        assert select.options[0].html == "Option 1"
        assert select.options[1].value == "2"
        assert select.options[1].html == "Option 2"
        assert select.options[2].value == ""
        assert select.options[2].html == ""

        # WHEN we add another option (this time adding it in between the other 2
        # options but using the option itself)
        select.options.add(
            value="3", html="Option 3", before=select.options[2], selected=True
        )

        # EXPECT the select element to have 3 options
        assert len(select.options) == 4

        # EXPECT the middle option to have the value and html we passed in
        assert select.options[0].value == "1"
        assert select.options[0].html == "Option 1"
        assert select.options[0].selected == select.options[0]._dom_element.selected == False
        assert select.options[1].value == "2"
        assert select.options[1].html == "Option 2"
        assert select.options[2].value == "3"
        assert select.options[2].html == "Option 3"
        assert select.options[2].selected == select.options[2]._dom_element.selected == True
        assert select.options[3].value == ""
        assert select.options[3].html == ""

        # WHEN we add another option (this time adding it in between the other 2
        # options but using the JS element of the option itself)
        select.options.add(value="2a", html="Option 2a", before=select.options[2]._dom_element)

        # EXPECT the select element to have 3 options
        assert len(select.options) == 5

        # EXPECT the middle option to have the value and html we passed in
        assert select.options[0].value == "1"
        assert select.options[0].html == "Option 1"
        assert select.options[1].value == "2"
        assert select.options[1].html == "Option 2"
        assert select.options[2].value == "2a"
        assert select.options[2].html == "Option 2a"
        assert select.options[3].value == "3"
        assert select.options[3].html == "Option 3"
        assert select.options[4].value == ""
        assert select.options[4].html == ""

    def test_select_options_remove(self):
        # GIVEN the existing select element with 3 options
        select = dom.find(f"#test_select_element_to_remove")[0]

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
        select = dom.find(f"#test_select_element_w_options")[0]

        # WHEN we get the selected option
        selected_option = select.options.selected

        # EXPECT the selected option to be correct
        assert selected_option.value == "2"
        assert selected_option.html == "Option 2"
        assert selected_option.selected == selected_option._dom_element.selected == True
