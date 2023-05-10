from textwrap import dedent

import js
from _pyscript_js import deepQuerySelector

from . import _internal
from ._mime import format_mime as _format_mime


class HTML:
    """
    Wrap a string so that display() can render it as plain HTML
    """

    def __init__(self, html):
        self._html = html

    def _repr_html_(self):
        return self._html


def write(element_id, value, append=False, exec_id=0):
    """Writes value to the element with id "element_id"""
    Element(element_id).write(value=value, append=append)
    js.console.warn(
        dedent(
            """PyScript Deprecation Warning: PyScript.write is
    marked as deprecated and will be removed sometime soon. Please, use
    Element(<id>).write instead."""
        )
    )


def display(*values, target=None, append=True):
    if target is None:
        target = _internal.DISPLAY_TARGET
    if target is None:
        raise Exception(
            "Implicit target not allowed here. Please use display(..., target=...)"
        )
    for v in values:
        Element(target).write(v, append=append)


class Element:
    def __init__(self, element_id, element=None):
        self._id = element_id
        self._element = element

    @property
    def id(self):
        return self._id

    @property
    def element(self):
        """Return the dom element"""
        if not self._element:
            self._element = deepQuerySelector(f"#{self._id}")
        return self._element

    @property
    def value(self):
        return self.element.value

    @property
    def innerHtml(self):
        return self.element.innerHTML

    def write(self, value, append=False):
        html, mime_type = _format_mime(value)
        if html == "\n":
            return

        if append:
            child = js.document.createElement("div")
            self.element.appendChild(child)

        if append and self.element.children:
            out_element = self.element.children[-1]
        else:
            out_element = self.element

        if mime_type in ("application/javascript", "text/html"):
            script_element = js.document.createRange().createContextualFragment(html)
            out_element.appendChild(script_element)
        else:
            out_element.innerHTML = html

    def clear(self):
        if hasattr(self.element, "value"):
            self.element.value = ""
        else:
            self.write("", append=False)

    def select(self, query, from_content=False):
        el = self.element

        if from_content:
            el = el.content

        _el = el.querySelector(query)
        if _el:
            return Element(_el.id, _el)
        else:
            js.console.warn(f"WARNING: can't find element matching query {query}")

    def clone(self, new_id=None, to=None):
        if new_id is None:
            new_id = self.element.id

        clone = self.element.cloneNode(True)
        clone.id = new_id

        if to:
            to.element.appendChild(clone)
            # Inject it into the DOM
            to.element.after(clone)
        else:
            # Inject it into the DOM
            self.element.after(clone)

        return Element(clone.id, clone)

    def remove_class(self, classname):
        if isinstance(classname, list):
            for cl in classname:
                self.remove_class(cl)
        else:
            self.element.classList.remove(classname)

    def add_class(self, classname):
        if isinstance(classname, list):
            for cl in classname:
                self.element.classList.add(cl)
        else:
            self.element.classList.add(classname)


def add_classes(element, class_list):
    for klass in class_list.split(" "):
        element.classList.add(klass)


def create(what, id_=None, classes=""):
    element = js.document.createElement(what)
    if id_:
        element.id = id_
    add_classes(element, classes)
    return Element(id_, element)
