from pyscript import document
from pyscript.web.elements import element_from_dom, ElementCollection


def find(selector):
    return ElementCollection([
        element_from_dom(el) for el in document.querySelectorAll(selector)
    ])


body = element_from_dom(document.body)
head = element_from_dom(document.head)
