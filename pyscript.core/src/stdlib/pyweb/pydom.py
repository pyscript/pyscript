import inspect
import sys
from functools import cached_property
from typing import Any

from pyodide.ffi import JsProxy
from pyodide.ffi.wrappers import add_event_listener
from pyscript import display, document, window

# from pyscript import when as _when

alert = window.alert


class BaseElement:
    def __init__(self, js_element):
        self._element = js_element
        self._parent = None
        self.style = StyleProxy(self)

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying JS element"""
        return isinstance(obj, BaseElement) and obj._element == self._element

    @property
    def parent(self):
        if self._parent:
            return self._parent

        if self._element.parentElement:
            self._parent = self.__class__(self._element.parentElement)

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
        elements = self._element.querySelectorAll(selector)
        if not elements:
            return None
        return ElementCollection([Element(el) for el in elements])

    # -------- Boilerplate Proxy for the Element API -------- #
    @property
    def append(self):
        return self._element.appendChild


class Element(BaseElement):
    def append(self, child):
        # TODO: this is Pyodide specific for now!!!!!!
        # if we get passed a JSProxy Element directly we just map it to the
        # higher level Python element
        if isinstance(child, JsProxy):
            return self.append(self.from_js(child))

        elif isinstance(child, Element):
            self.appendChild(child._element)

            return child

    def from_js(self, js_element):
        return self.__class__(js_element.tagName, parent=self)

    # TODO: These 2 should align with what we provide in Pydom.__get_item__
    # def query(self, selector):
    #     """The querySelector() method of the Element interface returns the first
    #     element that is a descendant of the element on which it is invoked that
    #     matches the specified group of selectors.
    #     """
    #     return self.__class__(self._element.querySelector(selector))

    # -------- Boilerplate Proxy for the Element API -------- #
    @property
    def html(self):
        return self._element.innerHTML

    @html.setter
    def html(self, value):
        self._element.innerHTML = value

    @property
    def content(self):
        # TODO: This breaks with with standard template elements. Define how to best
        #       handle this specifica use case. Just not support for now?
        return self._element.innerHTML

    @content.setter
    def content(self, value):
        # TODO: (same comment as above)
        display(value, target=self.id)

    @property
    def id(self):
        return self._element.id

    @id.setter
    def id(self, value):
        self._element.id = value

    @property
    def checked(self):
        return self._element.checked

    @checked.setter
    def checked(self, value):
        self._element.checked = value

    @property
    def value(self):
        tag = self._element.tagName
        if tag == "INPUT":
            if self._element.type == "checkbox":
                return self._element.checked
            elif self._element.type == "number":
                return float(self._element.value)
            else:
                return self._element.value
        return self._element.innerHTML

    @value.setter
    def value(self, value):
        # TODO: This needs a bit more thinking. SHould we set .innerHTML or .text for instance?
        tag = self._element.tagName
        # print(f"Writing ({tag} )---> {self._selector} ---> {value}")
        if tag == "INPUT":
            # print(f"Writing ({tag} | {self._element.type})---> {self._selector} ---> {value}")
            if self._element.type == "checkbox":
                self._element.checked = value
            elif self._element.type == "number":
                self._element.value = float(value)
            else:
                self._element.value = value
        else:
            self._element.innerHTML = value

    def clear(self):
        self.value = ""

    def clone(self, new_id=None):
        clone = Element(self._element.cloneNode(True))
        clone.id = new_id

        return clone

    def remove_class(self, classname):
        classList = self._element.classList
        if isinstance(classname, list):
            classList.remove(*classname)
        else:
            classList.remove(classname)
        return self

    def add_class(self, classname):
        classList = self._element.classList
        if isinstance(classname, list):
            classList.add(*classname)
        else:
            self._element.classList.add(classname)
        return self

    @property
    def classes(self):
        classes = self._element.classList.values()
        return [x for x in classes]

    def show_me(self):
        self._element.scrollIntoView()

    def when(self, event, handler):
        document.when(event, selector=self)(handler)

    # @staticmethod
    # def when(element, event_type):
    #     # TODO: Ideally, we should have that implemented in PyScript not patched here
    #     # if isinstance(element, Element):
    #     #     element = [element]
    #     def decorator(func):
    #         # elements = document.querySelectorAll(selector)
    #         sig = inspect.signature(func)

    #         # Function doesn't receive events
    #         if not sig.parameters:

    #             def wrapper(*args, **kwargs):
    #                 func()

    #             # for el in element:
    #             add_event_listener(element._element, event_type, wrapper)
    #         else:
    #             # for el in element:
    #             add_event_listener(element._element, event_type, func)
    #         return func
    #     return decorator


class StyleProxy(dict):
    def __init__(self, element: Element) -> None:
        self._element = element

    @cached_property
    def _style(self):
        return self._element._element.style

    def __getitem__(self, key):
        return self._style.getPropertyValue(key)

    def __setitem__(self, key, value):
        self._style.setProperty(key, value)

    def remove(self, key):
        self._style.removeProperty(key)

    def set(self, **kws):
        for k, v in kws.items():
            self._element._element.style.setProperty(k, v)

    # CSS Properties
    # Reference: https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L3799C1-L5005C2
    # Following prperties automatically generated from the above reference using
    # tools/codegen_css_proxy.py
    @property
    def visibility(self):
        return self._element._element.style.visibility

    @visibility.setter
    def visibility(self, value):
        self._element._element.style.visibility = value

    @property
    def background(self):
        return self._element._element.style.background

    @background.setter
    def background(self, value):
        self._element._element.style.background = value

    @property
    def color(self):
        return self._element._element.style.color

    @color.setter
    def color(self, value):
        self._element._element.style.color = value

    @property
    def backgroundColor(self):
        return self._element._element.style.backgroundColor

    @backgroundColor.setter
    def backgroundColor(self, value):
        self._element._element.style.backgroundColor = value


class StyleCollection:
    def __init__(self, collection: "ElementCollection") -> None:
        self._collection = collection

    def __get__(self, obj, objtype=None):
        return obj._get_attribute("style")

    # def __set__(self, obj, value):
    #     logging.info('Updating %r to %r', 'age', value)
    #     obj._age = value
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
        if isinstance(key, int):
            return self._elements[key]
        elif isinstance(key, slice):
            return ElementCollection(self._elements[key])

        # TODO: In this case what do we expect??
        elements = self._element.querySelectorAll(key)
        return ElementCollection([Element(el) for el in elements])

    def __len__(self):
        return len(self._elements)

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying JS element"""
        return isinstance(obj, ElementCollection) and obj._elements == self._elements

    def _get_attribute(self, attr):
        # As JQuery, when getting an attr, only return it for the first element
        return getattr(self._elements[0], attr)

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
    BaseElement = BaseElement
    Element = Element
    ElementCollection = ElementCollection

    def __init__(self):
        super().__init__(document)
        self.ids = DomScope()

    def create(self, type_, parent=None, classes=None, html=None):
        return super().create(type_, is_child=False)

    def __getitem__(self, key):
        if isinstance(key, int):
            indices = range(*key.indices(len(self.list)))
            return [self.list[i] for i in indices]

        elements = self._element.querySelectorAll(key)
        if not elements:
            return None
        return ElementCollection([Element(el) for el in elements])

    @staticmethod
    def when(event_type=None, selector=None):
        """
        Decorates a function and passes py-* events to the decorated function
        The events might or not be an argument of the decorated function
        """
        print("Inside when...")

        def decorator(func):
            if isinstance(selector, Element):
                elements = [selector._element]
            else:
                elements = document.querySelectorAll(selector)
            print("Elements....", elements)
            sig = inspect.signature(func)
            # Function doesn't receive events
            if not sig.parameters:

                def wrapper(*args, **kwargs):
                    func()

                for el in elements:
                    add_event_listener(el, event_type, wrapper)
            else:
                for el in elements:
                    add_event_listener(el, event_type, func)
            return func

        return decorator


dom = PyDom()


def query(selector):
    """The querySelector() method of the Element interface returns the first element
    that matches the specified group of selectors."""
    return Element(document.querySelector(selector))


def query_all(selector):
    """The querySelectorAll() method of the Element interface returns a static (not live)
    NodeList representing a list of the document's elements that match the specified
    group of selectors.
    """
    for element in document.querySelectorAll(selector):
        yield Element(element)


sys.modules[__name__] = dom
