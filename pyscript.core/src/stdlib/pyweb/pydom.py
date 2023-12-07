import sys
import warnings
from functools import cached_property
from typing import Any

from pyodide.ffi import JsProxy
from pyscript import display, document, window

alert = window.alert


class BaseElement:
    def __init__(self, js_element):
        self._js = js_element
        self._parent = None
        self.style = StyleProxy(self)
        self._proxies = {}

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying JS element"""
        return isinstance(obj, BaseElement) and obj._js == self._js

    @property
    def parent(self):
        if self._parent:
            return self._parent

        if self._js.parentElement:
            self._parent = self.__class__(self._js.parentElement)

        return self._parent

    @property
    def __class(self):
        return self.__class__ if self.__class__ != PyDom else Element

    def create(self, type_, is_child=True, classes=None, html=None, label=None):
        js_el = document.createElement(type_)
        element = self.__class(js_el)

        if classes:
            for class_ in classes:
                element.add_class(class_)

        if html is not None:
            element.html = html

        if label is not None:
            element.label = label

        if is_child:
            self.append(element)

        return element

    def find(self, selector):
        """Return an ElementCollection representing all the child elements that
        match the specified selector.

        Args:
            selector (str): A string containing a selector expression

        Returns:
            ElementCollection: A collection of elements matching the selector
        """
        elements = self._js.querySelectorAll(selector)
        if not elements:
            return None
        return ElementCollection([Element(el) for el in elements])


class Element(BaseElement):
    @property
    def children(self):
        return [self.__class__(el) for el in self._js.children]

    def append(self, child):
        # TODO: this is Pyodide specific for now!!!!!!
        # if we get passed a JSProxy Element directly we just map it to the
        # higher level Python element
        if isinstance(child, JsProxy):
            return self.append(Element(child))

        elif isinstance(child, Element):
            self._js.appendChild(child._js)

            return child

        elif isinstance(child, ElementCollection):
            for el in child:
                self.append(el)

    # -------- Pythonic Interface to Element -------- #
    @property
    def html(self):
        return self._js.innerHTML

    @html.setter
    def html(self, value):
        self._js.innerHTML = value

    @property
    def content(self):
        # TODO: This breaks with with standard template elements. Define how to best
        #       handle this specifica use case. Just not support for now?
        if self._js.tagName == "TEMPLATE":
            warnings.warn(
                "Content attribute not supported for template elements.", stacklevel=2
            )
            return None
        return self._js.innerHTML

    @content.setter
    def content(self, value):
        # TODO: (same comment as above)
        if self._js.tagName == "TEMPLATE":
            warnings.warn(
                "Content attribute not supported for template elements.", stacklevel=2
            )
            return

        display(value, target=self.id)

    @property
    def id(self):
        return self._js.id

    @id.setter
    def id(self, value):
        self._js.id = value

    @property
    def options(self):
        if "options" in self._proxies:
            return self._proxies["options"]

        if not self._js.tagName.lower() in {"select", "datalist", "optgroup"}:
            raise AttributeError(
                f"Element {self._js.tagName} has no options attribute."
            )
        self._proxies["options"] = OptionsProxy(self)
        return self._proxies["options"]

    @property
    def value(self):
        return self._js.value

    @value.setter
    def value(self, value):
        # in order to avoid confusion to the user, we don't allow setting the
        # value of elements that don't have a value attribute
        if not hasattr(self._js, "value"):
            raise AttributeError(
                f"Element {self._js.tagName} has no value attribute. If you want to "
                "force a value attribute, set it directly using the `_js.value = <value>` "
                "javascript API attribute instead."
            )
        self._js.value = value

    @property
    def selected(self):
        return self._js.selected

    @selected.setter
    def selected(self, value):
        # in order to avoid confusion to the user, we don't allow setting the
        # value of elements that don't have a value attribute
        if not hasattr(self._js, "selected"):
            raise AttributeError(
                f"Element {self._js.tagName} has no value attribute. If you want to "
                "force a value attribute, set it directly using the `_js.value = <value>` "
                "javascript API attribute instead."
            )
        self._js.selected = value

    def clone(self, new_id=None):
        clone = Element(self._js.cloneNode(True))
        clone.id = new_id

        return clone

    def remove_class(self, classname):
        classList = self._js.classList
        if isinstance(classname, list):
            classList.remove(*classname)
        else:
            classList.remove(classname)
        return self

    def add_class(self, classname):
        classList = self._js.classList
        if isinstance(classname, list):
            classList.add(*classname)
        else:
            self._js.classList.add(classname)
        return self

    @property
    def classes(self):
        classes = self._js.classList.values()
        return [x for x in classes]

    def show_me(self):
        self._js.scrollIntoView()


class OptionsProxy:
    """This class represents the options of a select element. It
    allows to access to add and remove options by using the `add` and `remove` methods.
    """

    def __init__(self, element: Element) -> None:
        self._element = element
        if self._element._js.tagName.lower() != "select":
            raise AttributeError(
                f"Element {self._element._js.tagName} has no options attribute."
            )

    def add(
        self,
        value: Any = None,
        html: str = None,
        text: str = None,
        before: Element | int = None,
        **kws,
    ) -> None:
        """Add a new option to the select element"""
        # create the option element and set the attributes
        option = document.createElement("option")
        if value is not None:
            kws["value"] = value
        if html is not None:
            option.innerHTML = html
        if text is not None:
            kws["text"] = text

        for key, value in kws.items():
            option.setAttribute(key, value)

        if before:
            if isinstance(before, Element):
                before = before._js

        self._element._js.add(option, before)

    def remove(self, item: int) -> None:
        """Remove the option at the specified index"""
        self._element._js.remove(item)

    def clear(self) -> None:
        """Remove all the options"""
        for i in range(len(self)):
            self.remove(0)

    @property
    def options(self):
        """Return the list of options"""
        return [Element(opt) for opt in self._element._js.options]

    @property
    def selected(self):
        """Return the selected option"""
        return self.options[self._element._js.selectedIndex]

    def __iter__(self):
        yield from self.options

    def __len__(self):
        return len(self.options)

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self)}) {self.options}"

    def __getitem__(self, key):
        return self.options[key]


class StyleProxy(dict):
    def __init__(self, element: Element) -> None:
        self._element = element

    @cached_property
    def _style(self):
        return self._element._js.style

    def __getitem__(self, key):
        return self._style.getPropertyValue(key)

    def __setitem__(self, key, value):
        self._style.setProperty(key, value)

    def remove(self, key):
        self._style.removeProperty(key)

    def set(self, **kws):
        for k, v in kws.items():
            self._element._js.style.setProperty(k, v)

    # CSS Properties
    # Reference: https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L3799C1-L5005C2
    # Following prperties automatically generated from the above reference using
    # tools/codegen_css_proxy.py
    @property
    def visible(self):
        return self._element._js.style.visibility

    @visible.setter
    def visible(self, value):
        self._element._js.style.visibility = value


class StyleCollection:
    def __init__(self, collection: "ElementCollection") -> None:
        self._collection = collection

    def __get__(self, obj, objtype=None):
        return obj._get_attribute("style")

    def __getitem__(self, key):
        return self._collection._get_attribute("style")[key]

    def __setitem__(self, key, value):
        for element in self._collection._elements:
            element.style[key] = value

    def remove(self, key):
        for element in self._collection._elements:
            element.style.remove(key)


class ElementCollection:
    def __init__(self, elements: [Element]) -> None:
        self._elements = elements
        self.style = StyleCollection(self)

    def __getitem__(self, key):
        # If it's an integer we use it to access the elements in the collection
        if isinstance(key, int):
            return self._elements[key]
        # If it's a slice we use it to support slice operations over the elements
        # in the collection
        elif isinstance(key, slice):
            return ElementCollection(self._elements[key])

        # If it's anything else (basically a string) we use it as a selector
        # TODO: Write tests!
        elements = self._element.querySelectorAll(key)
        return ElementCollection([Element(el) for el in elements])

    def __len__(self):
        return len(self._elements)

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying JS element"""
        return isinstance(obj, ElementCollection) and obj._elements == self._elements

    def _get_attribute(self, attr, index=None):
        if index is None:
            return [getattr(el, attr) for el in self._elements]

        # As JQuery, when getting an attr, only return it for the first element
        return getattr(self._elements[index], attr)

    def _set_attribute(self, attr, value):
        for el in self._elements:
            setattr(el, attr, value)

    @property
    def html(self):
        return self._get_attribute("html")

    @html.setter
    def html(self, value):
        self._set_attribute("html", value)

    @property
    def value(self):
        return self._get_attribute("value")

    @value.setter
    def value(self, value):
        self._set_attribute("value", value)

    @property
    def children(self):
        return self._elements

    def __iter__(self):
        yield from self._elements

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self._elements)}) {self._elements}"


class DomScope:
    def __getattr__(self, __name: str) -> Any:
        element = document[f"#{__name}"]
        if element:
            return element[0]


class PyDom(BaseElement):
    # Add objects we want to expose to the DOM namespace since this class instance is being
    # remapped as "the module" itself
    BaseElement = BaseElement
    Element = Element
    ElementCollection = ElementCollection

    def __init__(self):
        super().__init__(document)
        self.ids = DomScope()
        self.body = Element(document.body)
        self.head = Element(document.head)

    def create(self, type_, classes=None, html=None):
        return super().create(type_, is_child=False, classes=classes, html=html)

    def __getitem__(self, key):
        if isinstance(key, int):
            indices = range(*key.indices(len(self.list)))
            return [self.list[i] for i in indices]

        elements = self._js.querySelectorAll(key)
        if not elements:
            return None
        return ElementCollection([Element(el) for el in elements])


dom = PyDom()

sys.modules[__name__] = dom
