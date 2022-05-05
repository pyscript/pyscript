from datetime import datetime as dt


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
