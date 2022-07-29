from datetime import datetime as dt
import pyscript

class PyItem(pyscript.PyItemTemplate):
    def on_click(self, evt=None):
        self.data["done"] = not self.data["done"]
        self.strike(self.data["done"])

        self.select("input").element.checked = self.data["done"]


class PyList(pyscript.PyListTemplate):
    __tag__ = 'py-list'
    item_class = PyItem

    def add(self, item):
        if isinstance(item, str):
            item = {"content": item, "done": False, "created_at": dt.now()}

        super().add(item, labels=["content"], state_key="done")

# this is automatically called by <py-plugin>
def pyscript_init_plugin():
    pyscript.register_custom_widget(PyList)
