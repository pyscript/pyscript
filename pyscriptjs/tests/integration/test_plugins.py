from time import sleep

from .support import PyScriptTest

CE_PLUGIN_CODE = """
from pyscript import Plugin, console

plugin = Plugin('py-upper')

console.log("py_upper Plugin loaded")

@plugin.register_custom_element('py-up')
class Upper:
    def __init__(self, element):
        self.element = element

    def connect(self):
        console.log("Upper plugin connected")
        return self.element.source.upper()
"""

HOOKS_PLUGIN_CODE = """
from pyscript import Plugin, console


class TestLogger(Plugin):
    def configure(self, config):
        console.log('configure called')

    def beforeLaunch(self, config):
        console.log('beforeLaunch called')

    def afterSetup(self, config):
        console.log('afterSetup called')

    def afterStartup(self, config):
        console.log('afterStartup called')

    def onUserError(self, config):
        console.log('onUserError called')


plugin = TestLogger()
"""


class TestPlugin(PyScriptTest):
    def test_py_plugin_inline(self):
        self.writefile("py_upper.py", CE_PLUGIN_CODE)

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

    def test_execution_hooks(self):
        hooks_available = ['afterSetup', 'afterStartup']
        hooks_unavailable = ['configure', 'beforeLaunch']

        self.writefile("hooks_logger.py", HOOKS_PLUGIN_CODE)
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
        for method in hooks_available:
            assert f"{method} called" in log_lines

        for method in hooks_unavailable:
            assert f"{method} called" not in log_lines
