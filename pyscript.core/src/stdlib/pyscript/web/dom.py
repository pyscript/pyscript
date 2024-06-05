from pyscript import document
from pyscript.web.elements import Element, ElementCollection


class PyDom:
    # Add objects we want to expose to the DOM namespace since this class instance is being
    # remapped as "the module" itself
    ElementCollection = ElementCollection

    def __init__(self):
        self._js = document

        self.body = Element(document.body)
        self.head = Element(document.head)

    def __getitem__(self, key):
        elements = self._js.querySelectorAll(key)
        return ElementCollection([Element(el) for el in elements])


dom = PyDom()
