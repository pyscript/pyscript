from pyscript import document
from pyscript.web.elements import Element, ElementCollection


class DOM:
    def __init__(self):
        self.body = Element.from_dom(document.body)
        self.head = Element.from_dom(document.head)

    def __getitem__(self, selector):
        return self.find(selector)

    def find(self, selector):
        return ElementCollection(
            [Element.from_dom(el) for el in document.querySelectorAll(selector)]
        )


dom = DOM()
