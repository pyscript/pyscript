from pyscript import Plugin, PyListTemplate

plugin = Plugin("PyList")


@plugin.register_custom_element("py-list")
class PyList:
    def __init__(self, element):
        self.element = element

    def connect(self):
        py_list_template = PyListTemplate(self.element)
        py_list_template.connect()
