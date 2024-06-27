from pyscript import document
from pyscript.web.elements import element_from_dom, ElementCollection


class DOM:
    def __init__(self):
        self.body = element_from_dom(document.body)
        self.head = element_from_dom(document.head)

    def find(self, selector):
        return ElementCollection([
            element_from_dom(el) for el in document.querySelectorAll(selector)
        ])


dom = DOM()
