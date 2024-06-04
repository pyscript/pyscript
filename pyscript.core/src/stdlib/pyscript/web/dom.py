from pyscript import display, document, window
from pyscript.web.elements import Element


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


# class DomScope:
#     def __getattr__(self, __name: str):
#         element = document[f"#{__name}"]
#         if element:
#             return element[0]


class PyDom: #(BaseElement):
    # Add objects we want to expose to the DOM namespace since this class instance is being
    # remapped as "the module" itself
    # BaseElement = BaseElement
    # Element = Element
    ElementCollection = ElementCollection

    def __init__(self):
        # PyDom is a special case of BaseElement where we don't want to create a new JS element
        # and it really doesn't have a need for styleproxy or parent to to call to __init__
        # (which actually fails in MP for some reason)

        # TODO: Check if we can prune the follow 4 
        self._js = document
        # self._parent = None
        # self._proxies = {}
        # self.ids = DomScope()
        self.body = Element(document.body)
        self.head = Element(document.head)

    # def create(self, type_, classes=None, html=None):
    #     return super().create(type_, is_child=False, classes=classes, html=html)

    def __getitem__(self, key):
        elements = self._js.querySelectorAll(key)
        if not elements:
            return None
        return ElementCollection([Element(el) for el in elements])

dom = PyDom()
