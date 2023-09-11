import pytest
from pyscript import document
from unittest import mock

from pyweb import pydom


class TestDocument:
    def test__element(self):
        assert pydom._element == document

    def test_no_parent(self):
        assert pydom.parent is None

    def test_create_element(self):
        new_el = pydom.create("div")
        assert isinstance(new_el, pydom.BaseElement)
        assert new_el._element.tagName == "DIV"
        # EXPECT the new element to be associated with the document
        assert new_el.parent == None


def test_getitem_by_id():
    # GIVEN an existing element on the page with a known text content
    id_ = "test_id_selector"
    txt = "You found test_id_selector"
    selector = f"#{id_}"
    # EXPECT the element to be found by id
    result = pydom[selector]
    div = result[0]
    # EXPECT the element text value to match what we expect and what
    # the JS document.querySelector API would return
    assert document.querySelector(selector).innerHTML == div.html == txt
    # EXPECT the results to be of the right types
    assert isinstance(div, pydom.BaseElement)
    assert isinstance(result, pydom.ElementCollection)


def test_getitem_by_class():
    id_ = "test_class_selector"
    expected_class = "a-test-class"
    result = pydom[f".{expected_class}"]
    div = result[0]

    # EXPECT to find exact number of elements with the class in the page (== 1)
    assert len(result) == 1
    # EXPECT the element id to match what we expect
    assert div.id == id_


def test_read_n_write_collection_elements():
    elements = pydom[".multi-elem-div"]

    # ids = [f"#test_rr_input_{x}" for x in ["txt", "btn", "email", "password"]]
    # values = el.read_elements(ids)
    for element in elements:
        assert element.text == f"Content {element.id.replace('#', '')}"

    new_content = "New Content"
    elements.text = new_content
    for element in elements:
        assert element.text == new_content


class TestElement:
    def test_query(self):
        # GIVEN an existing element on the page, with at least 1 child element
        id_ = "test_selector_w_children"
        parent_div = el.query(f"#{id_}")

        # EXPECT it to be able to query for the first child element
        div = parent_div.query("div")

        # EXPECT the new element to be associated with the parent
        assert div.parent == parent_div
        # EXPECT the new element to be a CoreElement
        assert isinstance(div, el.CoreElement)
        # EXPECT the div attributes to be == to how they are configured in the page
        assert div.innerHTML == "Child 1"
        assert div.id == "test_selector_w_children_child_1"

    def test_equality(self):
        # GIVEN 2 different Elements pointing to the same underlying element
        id_ = "test_id_selector"
        div = el.query(f"#{id_}")
        div2 = el.query(f"#{id_}")
        # EXPECT them to be equal
        assert div == div2
        # EXPECT their value to always be equal
        assert div.value == div2.value
        div.value = "foo"
        assert div.value == div2.value

    def test_read_classes(self):
        id_ = "test_class_selector"
        expected_class = "a-test-class"
        div = el.query(f"#{id_}")
        assert div.classes == [expected_class]

    def test_add_remove_class(self):
        id_ = "div-no-classes"
        classname = "tester-class"
        div = el.query(f"#{id_}")
        assert not div.classes
        div.add_class(classname)
        same_div = el.query(f"#{id_}")
        assert div.classes == [classname] == same_div.classes
        div.remove_class(classname)
        assert div.classes == [] == same_div.classes
