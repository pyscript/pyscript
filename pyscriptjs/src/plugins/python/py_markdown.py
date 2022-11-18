from textwrap import dedent

from markdown import markdown

from pyscript import Plugin, console

# plugin = Plugin("py-markdown")  # priority is optional, of course

class MyPlugin(Plugin):
    def configure(self, config):
        console.log(f"GOT CONFIG!! {config}")

    def afterStartup(self, runtime):
        console.log(f"GOT RUNTIME!! {runtime}")

plugin = MyPlugin("py-markdown")

@plugin.register_custom_element("py-md")
class PyMarkdown:
    def __init__(self, element):
        self.element = element

    def connect(self):
        self.element.innerHTML = markdown(
            dedent(self.element.source), extensions=["fenced_code"]
        )
