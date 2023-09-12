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
    ids = [
        "test_class_selector",
        "test_selector_w_children",
        "test_selector_w_children_child_1",
    ]
    expected_class = "a-test-class"
    result = pydom[f".{expected_class}"]
    div = result[0]

    # EXPECT to find exact number of elements with the class in the page (== 3)
    assert len(result) == 3

    # EXPECT that all element ids are in the expected list
    assert [el.id for el in result] == ids


def test_read_n_write_collection_elements():
    elements = pydom[".multi-elems"]

    # ids = [f"#test_rr_input_{x}" for x in ["txt", "btn", "email", "password"]]
    # values = el.read_elements(ids)
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
        parent_div = pydom[f"#{id_}"][0]

        # EXPECT it to be able to query for the first child element
        div = parent_div.find("div")[0]

        # EXPECT the new element to be associated with the parent
        assert div.parent == parent_div
        # EXPECT the new element to be a BaseElement
        assert isinstance(div, pydom.BaseElement)
        # EXPECT the div attributes to be == to how they are configured in the page
        assert div.html == "Child 1"
        assert div.id == "test_selector_w_children_child_1"

    def test_equality(self):
        # GIVEN 2 different Elements pointing to the same underlying element
        id_ = "test_id_selector"
        selector = f"#{id_}"
        div = pydom[selector][0]
        div2 = pydom[selector][0]

        # EXPECT them to be equal
        assert div == div2
        # EXPECT them to be different objects
        assert div is not div2

        # EXPECT their value to always be equal
        assert div.html == div2.html
        div.html = "some value"

        assert div.value == div2.value == "some value"

    def test_read_classes(self):
        id_ = "test_class_selector"
        expected_class = "a-test-class"
        div = pydom[f"#{id_}"][0]
        assert div.classes == [expected_class]

    def test_add_remove_class(self):
        id_ = "div-no-classes"
        classname = "tester-class"
        div = pydom[f"#{id_}"][0]
        assert not div.classes
        div.add_class(classname)
        same_div = pydom[f"#{id_}"][0]
        assert div.classes == [classname] == same_div.classes
        div.remove_class(classname)
        assert div.classes == [] == same_div.classes


class TestCollection:
    def test_iter_eq_children(self):
        elements = pydom[".multi-elems"]
        assert [el for el in elements] == [el for el in elements.children]
        assert len(elements) == 3

    def test_slices(self):
        elements = pydom[".multi-elems"]
        assert elements[0]
        _slice = elements[:2]
        assert len(_slice) == 2
        for i, el in enumerate(_slice):
            assert el == elements[i]
        assert elements[:] == elements

    def test_style_rule(self):
        selector = ".multi-elems"
        elements = pydom[selector]
        for el in elements:
            assert el.style["background-color"] != "red"

        elements.style["background-color"] = "red"

        for i, el in enumerate(pydom[selector]):
            assert elements[i].style["background-color"] == "red"
            assert el.style["background-color"] == "red"

        elements.style.remove("background-color")

        for i, el in enumerate(pydom[selector]):
            assert el.style["background-color"] != "red"
            assert elements[i].style["background-color"] != "red"


class TestCreation:
    def test_create_document_element(self):
        new_el = pydom.create("div")
        new_el.id = "new_el_id"
        assert isinstance(new_el, pydom.BaseElement)
        assert new_el._element.tagName == "DIV"
        # EXPECT the new element to be associated with the document
        assert new_el.parent == None
        pydom.body.append(new_el)

        assert pydom["#new_el_id"][0].parent == pydom.body
