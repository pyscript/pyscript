from pyscript import document
from pyscript.web.elements import Element, ElementCollection


class DOM:
    def __init__(self):
        self.body = Element.from_dom_element(document.body)
        self.head = Element.from_dom_element(document.head)

    def __getitem__(self, selector):
        return self.find(selector)

    @staticmethod
    def find(selector):
        return ElementCollection(
            [
                Element.from_dom_element(dom_element)
                for dom_element in document.querySelectorAll(selector)
            ]
        )


dom = DOM()
