import xml.dom
from xml.dom.minidom import Node  # nosec

import js
import pyscript


class classList:
    """Class that (lightly) emulates the behaviour of HTML Nodes ClassList"""

    def __init__(self):
        self._classes = []

    def add(self, classname: str):
        """Add classname to the classList"""
        self._classes.append(classname)

    def remove(self, classname: str):
        """Remove classname from the classList"""
        self._classes.remove(classname)


class PluginsManager:
    """
    Emulator of PyScript PluginsManager that can be used to simulate plugins lifecycle events

    TODO: Currently missing most of the lifecycle events in PluginsManager implementation. Need
        to add more than just addPythonPlugin
    """

    def __init__(self):
        self.plugins = []

        # mapping containing all the custom elements createed by plugins
        self._custom_elements = {}

    def addPythonPlugin(self, pluginInstance: pyscript.Plugin):
        """
        Add a pluginInstance to the plugins managed by the PluginManager and calls
        pluginInstance.init(self) to initialized the plugin with the manager
        """
        pluginInstance.init(self)
        self.plugins.append(pluginInstance)

    def reset(self):
        """
        Unregister all plugins and related custom elements.
        """
        for plugin in self.plugins:
            plugin.app = None

        self.plugins = []
        self._custom_elements = {}


class CustomElement:
    def __init__(self, plugin_class: pyscript.Plugin):
        self.pyPluginInstance = plugin_class(self)
        self.attributes = {}
        self.innerHTML = ""

    def connectedCallback(self):
        return self.pyPluginInstance.connect()

    def getAttribute(self, attr: str):
        return self.attributes.get(attr)


def define_custom_element(tag, plugin_class: pyscript.Plugin):
    """
    Mock method to emulate the behaviour of the PyScript `define_custom_element`
    that basically creates a new CustomElement passing plugin_class as Python
    proxy object. For more info check out the logic of the original implementation at:

    src/plugin.ts:define_custom_element
    """
    ce = CustomElement(plugin_class)
    plugins_manager._custom_elements[tag] = ce


plugins_manager = PluginsManager()

# Init pyscript testing mocks
impl = xml.dom.getDOMImplementation()


class Node:
    """
    Represent an HTML Node.

    This classes us an abstraction on top of xml.dom.minidom.Node
    """

    def __init__(self, el: Node):
        self._el = el
        self.classList = classList()

    # Automatic delegation is a simple and short boilerplate:
    def __getattr__(self, attr: str):
        return getattr(self._el, attr)

    def createElement(self, *args, **kws):
        newEl = self._el.createElement(*args, **kws)
        return Node(newEl)


class Document(Node):
    """
    Represent an HTML Document.

    This classes us an abstraction on top of xml.dom.minidom.Document
    """

    def __init__(self):
        self._el = impl.createDocument(None, "document", None)


js.document = doc = Document()
js.document.head = doc.createElement("head")
js.document.body = doc.createElement("body")
