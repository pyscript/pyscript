from time import sleep

from .support import PyScriptTest

PLUGIN_CODE = """
from pyscript import Plugin, console

plugin = Plugin('py-upper')

console.log("py_upper Plugin loaded")

@plugin.register_custom_element('py-up')
class Upper:
    def __init__(self, source):
        self.source = source

    def connect(self):
        console.log("Upper plugin connected")
        return self.source.upper()
"""


class TestPlugin(PyScriptTest):
    def test_py_plugin_inline(self):
        self.writefile("py_upper.py", PLUGIN_CODE)

        # NOTE: sleep is needed here to avoid flakiness between the file above being written
        #       and sometimes not yet "available"
        sleep(1.5)

        self.pyscript_run(
            """
        <py-config>
            plugins = [
                "./py_upper.py"
            ]
        </py-config>

        <py-up>
            Hello World
        </py-up>
        """
        )
        log_lines = self.console.log.lines
        for log_line in ["py_upper Plugin loaded", "Upper plugin connected"]:
            assert log_line in log_lines

        rendered_text = self.page.locator("py-up").inner_text()
        assert rendered_text == "HELLO WORLD"
