from textwrap import dedent

from markdown import markdown

from pyscript import Plugin

plugin = Plugin("py-markdown")  # priority is optional, of course


@plugin.register_custom_element("py-md")
class PyMarkdown:
    def __init__(self, element):
        self.element = element

    def connect(self):
        self.element.innerHTML = markdown(
            dedent(self.element.source), extensions=["fenced_code"]
        )
