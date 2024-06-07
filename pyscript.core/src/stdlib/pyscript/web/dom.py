from pyscript import document
from pyscript.web.elements import element_from_js, BaseElement, ElementCollection


# TODO: mic: naming  - this is really the document... Could this be in elements now?
# and called Document?
class PyDOM:
    # TODO: mic: do we still need this?
    ElementCollection = ElementCollection

    def __init__(self):
        self._js = document

        self.body = BaseElement(document.body)
        self.head = BaseElement(document.head)

    def __getitem__(self, key):
        elements = self._js.querySelectorAll(key)
        return ElementCollection([element_from_js(el) for el in elements])


dom = PyDOM()
