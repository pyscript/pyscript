from _pyscript_js import define_custom_element
from js import console
from pyodide.ffi import create_proxy


class Plugin:
    def __init__(self, name=None):
        if not name:
            name = self.__class__.__name__

        self.name = name
        self._custom_elements = []
        self.app = None

    def init(self, app):
        self.app = app

    def configure(self, config):
        pass

    def afterSetup(self, interpreter):
        pass

    def afterStartup(self, interpreter):
        pass

    def beforePyScriptExec(self, interpreter, src, pyScriptTag):
        pass

    def afterPyScriptExec(self, interpreter, src, pyScriptTag, result):
        pass

    def beforePyReplExec(self, interpreter, src, outEl, pyReplTag):
        pass

    def afterPyReplExec(self, interpreter, src, outEl, pyReplTag, result):
        pass

    def onUserError(self, error):
        pass

    def register_custom_element(self, tag):
        """
        Decorator to register a new custom element as part of a Plugin and associate
        tag to it. Internally, it delegates the registration to the PyScript internal
        [JS] plugin manager, who actually creates the JS custom element that can be
        attached to the page and instantiate an instance of the class passing the custom
        element to the plugin constructor.

        Exammple:
        >> plugin = Plugin("PyTutorial")
        >> @plugin.register_custom_element("py-tutor")
        >> class PyTutor:
        >>     def __init__(self, element):
        >>     self.element = element
        """
        # TODO: Ideally would be better to use the logger.
        console.info(f"Defining new custom element {tag}")

        def wrapper(class_):
            # TODO: this is very pyodide specific but will have to do
            #       until we have JS interface that works across interpreters
            define_custom_element(tag, create_proxy(class_))  # noqa: F821

        self._custom_elements.append(tag)
        return create_proxy(wrapper)
