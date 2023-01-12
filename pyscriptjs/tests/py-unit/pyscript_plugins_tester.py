import xml.dom

import pyscript


class classList:
    def __init__(self):
        self._classes = []

    def add(self, classname):
        self._classes.append(classname)

    def remove(self, classname):
        self._classes.remove(classname)


class PluginsManager:
    def __init__(self):
        self.plugins = []

        # mapping containing all the custom elements createed by plugins
        self._custom_elements = {}

    def addPythonPlugin(self, pluginInstance):
        pluginInstance.init(self)
        self.plugins.append(pluginInstance)


class CustomElement:
    def __init__(self, plugin_class):
        self.pyPluginInstance = plugin_class(self)
        self.attributes = {}
        self.innerHTML = ""

    def connectedCallback(self):
        return self.pyPluginInstance.connect()

    def getAttribute(self, attr):
        return self.attributes.get(attr)


def define_custom_element(tag, plugin_class):
    ce = CustomElement(plugin_class)
    plugins_manager._custom_elements[tag] = ce

    # plugins_manager.addPythonPlugin(plugin_class)


plugins_manager = PluginsManager()

# Init pyscript testing mocks
impl = xml.dom.getDOMImplementation()


class Node:
    def __init__(self, el):
        self._el = el
        self.classList = classList()

    # Automatic delegation is a simple and short boilerplate:
    def __getattr__(self, attr):
        return getattr(self._el, attr)

    def createElement(self, *args, **kws):
        newEl = self._el.createElement(*args, **kws)
        return Node(newEl)


class Document(Node):
    def __init__(self):
        self._el = impl.createDocument(None, "document", None)


pyscript.js.document = doc = Document()
pyscript.js.document.head = doc.createElement("head")
pyscript.js.document.body = doc.createElement("body")
