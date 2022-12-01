from textwrap import dedent
import html
from markdown import markdown
from pyscript import Plugin, console
from js import console


console.warn(
    "WARNING: This plugin is still in a very experimental phase and will likely change"
    " and potentially break in the future releases. Use it with caution."
)


class MyPlugin(Plugin):
    def configure(self, config):
        console.log(f"configuration received: {config}")

    def afterStartup(self, runtime):
        console.log(f"runtime received: {runtime}")


plugin = MyPlugin("py-markdown")


@plugin.register_custom_element("py-md")
class PyMarkdown:
    def __init__(self, element):
        self.element = element

    def connect(self):
        unescaped_content = html.unescape(self.element.originalInnerHTML)
        original = dedent(unescaped_content)
        inner = markdown(original, extensions=["fenced_code"])
        self.element.innerHTML = inner
