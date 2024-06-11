from pyscript import document
from pyscript.web.elements import element_from_js, ElementCollection


# TODO: mic: naming  - this is really the document... Could this be in elements now?
class Document:
    # TODO: mic: do we still need this?
    ElementCollection = ElementCollection

    def __init__(self):
        self._js = document

        self.body = element_from_js(document.body)
        self.head = element_from_js(document.head)

    def __getitem__(self, key):
        return ElementCollection([
            element_from_js(el) for el in self._js.querySelectorAll(key)
        ])


# TODO: Why not....
# def find(selector):
#     return ElementCollection([
#         element_from_js(el) for el in document.querySelectorAll(key)
#     ])
#
#
# body = element_from_js(document.body)
# head = element_from_js(document.head)
#
# Instead of...
dom = Document()
