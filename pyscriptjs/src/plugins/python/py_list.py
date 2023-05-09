from datetime import datetime as dt
from pyscript import Plugin, PyListTemplate, PyItemTemplate

plugin = Plugin("PyList")


class PyItem(PyItemTemplate):
    def on_click(self, evt=None):
        self.data["done"] = not self.data["done"]
        self.strike(self.data["done"])

        self.select("input").element.checked = self.data["done"]


class PyList(PyListTemplate):
    item_class = PyItem

    def add(self, item):
        if isinstance(item, str):
            item = {"content": item, "done": False, "created_at": dt.now()}

        super().add(item, labels=["content"], state_key="done")


@plugin.register_custom_element("py-list")
class PyList:
    def __init__(self, element):
        self.element = element

    def connect(self):
        py_list_template = PyListTemplate(self.element)
        py_list_template.connect()
