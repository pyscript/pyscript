from pyscript import display, document, window
from pyscript.web.elements import Element, ElementCollection

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
