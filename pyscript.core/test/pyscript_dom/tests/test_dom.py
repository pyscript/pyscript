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
        assert isinstance(new_el, el.CoreElement)
        assert new_el._element.tagName == "DIV"
        # EXPECT the new element to be associated with the document
        assert new_el.parent == None


def test_query_by_id():
    id_ = "test_id_selector"
    txt = "You found test_id_selector"
    div = el.query(f"#{id_}")
    assert div.innerHTML == txt
    assert document.querySelector(f"#{id_}").innerHTML == txt
    assert isinstance(div, el.CoreElement)


def test_query_by_class():
    id_ = "test_class_selector"
    expected_class = "a-test-class"
    div = el.query(f".{expected_class}")
    assert div.id == id_


def test_read_n_write_elements():
    ids = [f"#test_rr_input_{x}" for x in ["txt", "btn", "email", "password"]]
    values = el.read_elements(ids)
    for k, v in values.items():
        assert v == f"Content {k.replace('#', '')}"

    new_values = {k: f"New Content {k.replace('#', '')}" for k in values.keys()}
    el.write_elements(new_values)
    for k, v in new_values.items():
        assert el.query(k).value == v


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
