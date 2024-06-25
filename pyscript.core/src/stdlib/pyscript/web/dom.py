from pyscript import document
from pyscript.web.elements import element_from_js, ElementCollection


def find(selector):
    return ElementCollection([
        element_from_js(el) for el in document.querySelectorAll(selector)
    ])


body = element_from_js(document.body)
head = element_from_js(document.head)
